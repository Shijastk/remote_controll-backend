const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const { mouse, screen: nutScreen } = require('@nut-tree-fork/nut-js');

// Store intervals per socket
const streams = new Map();

async function getScreenSize() {
  try {
    const width = await nutScreen.width();
    const height = await nutScreen.height();
    return { width, height };
  } catch (e) {
    // Fallback to screenshot-desktop detection
    try {
      const displays = await screenshot.listDisplays();
      if (displays && displays.length > 0) {
        return { width: displays[0].width || 1920, height: displays[0].height || 1080 };
      }
    } catch (err) {}
  }
  return { width: 1920, height: 1080 };
}

function startStream(socket, connectionId = null) {
  stopStream(socket);

  console.log(`Starting screen stream for socket ${socket.id} (Relay: ${!!connectionId})`);
  
  const interval = setInterval(async () => {
    if (!socket.connected) {
      stopStream(socket);
      return;
    }
    try {
      const img = await screenshot();
      const pos = await mouse.getPosition();
      const screenSize = await getScreenSize();

      // Simple cursor SVG
      const cursorSvg = Buffer.from(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 3.21V20.8L10.3 16.03L13.1 22.82L15.9 21.66L13.1 14.87H19.5L5.5 3.21Z" fill="white" stroke="black" stroke-width="1.5"/>
        </svg>
      `);

      const buffer = await sharp(img)
        .composite([{
          input: cursorSvg,
          top: Math.max(0, Math.round((pos.y / screenSize.height) * (await sharp(img).metadata()).height)),
          left: Math.max(0, Math.round((pos.x / screenSize.width) * (await sharp(img).metadata()).width))
        }])
        .resize(800)
        .jpeg({ quality: 60 })
        .toBuffer();

      const frameData = { frame: buffer.toString('base64') };
      
      if (connectionId) {
        socket.emit('relay', { connectionId, event: 'screen:frame', data: frameData });
      } else {
        socket.emit('screen:frame', frameData);
      }
    } catch (e) {
      console.error('Screen capture error:', e.message);
    }
  }, 250); // Slightly slower for cloud stability

  streams.set(socket.id, interval);
}

function stopStream(socket) {
  const id = typeof socket === 'string' ? socket : socket.id;
  const interval = streams.get(id);
  if (interval) {
    clearInterval(interval);
    streams.delete(id);
    console.log(`Screen stream stopped for socket ${id}`);
  }
}

module.exports = { getScreenSize, startStream, stopStream };
