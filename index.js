const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const { exec } = require('child_process');
const qrcode = require('qrcode-terminal');

const fs = require('fs');
const path = require('path');

const mouseHandler = require('./handlers/mouse.handler');
const keyboardHandler = require('./handlers/keyboard.handler');
const mediaHandler = require('./handlers/media.handler');
const systemHandler = require('./handlers/system.handler');
const screenHandler = require('./handlers/screen.handler');

const CONFIG_PATH = path.join(__dirname, 'config.json');

function getOrGenerateID() {
  if (fs.existsSync(CONFIG_PATH)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (config.connectionId) return config.connectionId;
  }
  const newId = Math.floor(100000 + Math.random() * 900000).toString();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ connectionId: newId }, null, 2));
  return newId;
}

const CONNECTION_ID = getOrGenerateID();
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

function handleEvent(event, data, socket) {
  switch (event) {
    case 'mouse:move': mouseHandler.move(data); break;
    case 'mouse:moveTo': mouseHandler.moveTo(data); break;
    case 'mouse:click': mouseHandler.click(data); break;
    case 'mouse:scroll': mouseHandler.scroll(data); break;
    case 'mouse:press': mouseHandler.pressButton(data); break;
    case 'mouse:release': mouseHandler.releaseButton(data); break;
    case 'key:press': keyboardHandler.press(data); break;
    case 'key:type': keyboardHandler.type(data); break;
    case 'key:combo': keyboardHandler.combo(data); break;
    case 'media:control': mediaHandler.control(data); break;
    case 'media:volume': 
      mediaHandler.volume(data).then(v => socket.emit('volume:level', v));
      break;
    case 'system:command': systemHandler.execute(data); break;
    case 'screen:start': screenHandler.startStream(socket); break; 
    case 'screen:stop': screenHandler.stopStream(socket); break;
    case 'screen:getSize':
      screenHandler.getScreenSize().then(size => socket.emit('screen:size', size));
      break;
  }
}

// --- SOCKET SERVER ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('spotify:track', { track: lastTrack || null });
  mediaHandler.getVolume().then(v => socket.emit('volume:level', v));
  screenHandler.getScreenSize().then(size => socket.emit('screen:size', size));

  const events = [
    'mouse:move', 'mouse:moveTo', 'mouse:click', 'mouse:scroll', 'mouse:doubleclick', 
    'mouse:press', 'mouse:release', 'key:press', 'key:type', 'key:combo', 
    'media:control', 'media:volume', 'system:command', 'screen:start', 'screen:stop', 'screen:getSize'
  ];

  events.forEach(event => {
    socket.on(event, (data) => handleEvent(event, data, socket));
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
  
  console.log('\n' + '='.repeat(40));
  console.log('🚀 PC REMOTE PRIVACY AGENT ONLINE');
  console.log('='.repeat(40));
  console.log(`\n📍 LOCAL IP (Use on Website):  ${ip}`);
  console.log(`\n🔗 FULL ACCESS URL: ${url}`);
  console.log('='.repeat(40) + '\n');
  
  qrcode.generate(url, { small: true });
});
