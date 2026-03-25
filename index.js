const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const { exec } = require('child_process');
const qrcode = require('qrcode-terminal');

const mouseHandler = require('./handlers/mouse.handler');
const keyboardHandler = require('./handlers/keyboard.handler');
const mediaHandler = require('./handlers/media.handler');
const systemHandler = require('./handlers/system.handler');
const screenHandler = require('./handlers/screen.handler');

const PORT = 3001; 
const TOKEN = 'remote123';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve empty dashboard or stats if needed
app.get('/', (req, res) => res.send('Remote Control Server Running'));

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

// Spotify Polling
let lastTrack = '';
setInterval(() => {
  const ps = `powershell -NoProfile -Command "try { $t = (Get-Process -Name 'Spotify' -ErrorAction Stop | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -First 1).MainWindowTitle; if ($t -and $t -ne 'Spotify') { $t } else { '' } } catch { '' }"`;
  exec(ps, (err, stdout) => {
    if (err) return;
    const track = stdout.trim();
    if (track !== lastTrack) {
      lastTrack = track;
      io.emit('spotify:track', { track: track || null });
    }
  });
}, 3000);

// Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === TOKEN) next();
  else next(new Error('Unauthorized'));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('spotify:track', { track: lastTrack || null });
  mediaHandler.getVolume().then(v => socket.emit('volume:level', v));
  screenHandler.getScreenSize().then(size => socket.emit('screen:size', size));

  // Forward events to handlers
  socket.on('mouse:move', (data) => mouseHandler.move(data));
  socket.on('mouse:moveTo', (data) => {
    console.log('Mouse moveTo:', data);
    mouseHandler.moveTo(data);
  });
  socket.on('mouse:click', (data) => mouseHandler.click(data));
  socket.on('mouse:scroll', (data) => mouseHandler.scroll(data));
  socket.on('mouse:doubleclick', () => mouseHandler.doubleclick());
  socket.on('mouse:press', (data) => mouseHandler.pressButton(data));
  socket.on('mouse:release', (data) => mouseHandler.releaseButton(data));

  socket.on('key:press', (data) => keyboardHandler.press(data));
  socket.on('key:type', (data) => keyboardHandler.type(data));
  socket.on('key:combo', (data) => keyboardHandler.combo(data));

  socket.on('media:control', (data) => mediaHandler.control(data));
  socket.on('media:volume', async (data) => {
    const v = await mediaHandler.volume(data);
    io.emit('volume:level', v);
  });

  socket.on('system:command', (data) => systemHandler.execute(data));

  socket.on('screen:start', () => screenHandler.startStream(socket));
  socket.on('screen:stop', () => screenHandler.stopStream(socket));
  socket.on('screen:getSize', () => {
    screenHandler.getScreenSize().then(size => socket.emit('screen:size', size));
  });

  socket.on('ping', () => socket.emit('pong'));
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    screenHandler.stopStream(socket);
  });
});

server.listen(PORT, () => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}?token=${TOKEN}`;
  console.log(`\nServer active at: ${url}`);
  qrcode.generate(url, { small: true });
});
