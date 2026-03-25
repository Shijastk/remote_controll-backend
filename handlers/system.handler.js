const { exec } = require('child_process');

module.exports = {
  execute: async ({ command }) => {
    try {
      let cmd = '';
      switch (command) {
        case 'shutdown': cmd = 'shutdown /s /t 0'; break;
        case 'restart':  cmd = 'shutdown /r /t 0'; break;
        case 'sleep':    cmd = 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0'; break;
        case 'spotify':  cmd = 'start spotify'; break;
        case 'chrome':   cmd = 'start chrome'; break;
        case 'calculator': cmd = 'start calc'; break;
        case 'notepad':  cmd = 'start notepad'; break;
      }
      if (cmd) exec(cmd);
    } catch (e) { console.error('System command error:', e); }
  }
};
