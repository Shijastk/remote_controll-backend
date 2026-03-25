const { keyboard, Key } = require('@nut-tree-fork/nut-js');

module.exports = {
  press: async ({ key }) => {
    try {
      const k = Key[key.toUpperCase()] || Key[key];
      if (k) await keyboard.pressKey(k);
    } catch (e) { console.error('Key press error:', e); }
  },
  type: async ({ text }) => {
    try {
      await keyboard.type(text);
    } catch (e) { console.error('Key type error:', e); }
  },
  combo: async ({ keys }) => {
    try {
      if (keys === 'selectall') {
        await keyboard.pressKey(Key.LeftControl, Key.A);
        await keyboard.releaseKey(Key.LeftControl, Key.A);
      } else if (Array.isArray(keys)) {
        const keyList = keys.map(k => Key[k.toUpperCase()] || Key[k]).filter(Boolean);
        await keyboard.pressKey(...keyList);
        await keyboard.releaseKey(...keyList);
      }
    } catch (e) { console.error('Key combo error:', e); }
  }
};
