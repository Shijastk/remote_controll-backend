const { mouse, Button, Point } = require('@nut-tree-fork/nut-js');

module.exports = {
  move: async ({ dx, dy }) => {
    try {
      const pos = await mouse.getPosition();
      await mouse.setPosition(new Point(pos.x + dx, pos.y + dy));
    } catch (e) { console.error('Mouse move error:', e); }
  },
  moveTo: async ({ x, y }) => {
    try {
      await mouse.setPosition(new Point(x, y));
    } catch (e) { console.error('Mouse moveTo error:', e); }
  },
  click: async ({ button }) => {
    try {
      const b = button === 'right' ? Button.RIGHT : button === 'middle' ? Button.MIDDLE : Button.LEFT;
      await mouse.click(b);
    } catch (e) { console.error('Mouse click error:', e); }
  },
  scroll: async ({ dy }) => {
    try {
      if (dy > 0) await mouse.scrollDown(dy);
      else await mouse.scrollUp(Math.abs(dy));
    } catch (e) { console.error('Mouse scroll error:', e); }
  },
  doubleclick: async () => {
    try {
      await mouse.doubleClick(Button.LEFT);
    } catch (e) { console.error('Mouse double-click error:', e); }
  },
  pressButton: async ({ button }) => {
    try {
      const b = button === 'right' ? Button.RIGHT : Button.LEFT;
      await mouse.pressButton(b);
    } catch (e) { console.error('Mouse press error:', e); }
  },
  releaseButton: async ({ button }) => {
    try {
      const b = button === 'right' ? Button.RIGHT : Button.LEFT;
      await mouse.releaseButton(b);
    } catch (e) { console.error('Mouse release error:', e); }
  }
};
