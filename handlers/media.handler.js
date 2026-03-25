const { exec } = require('child_process');
const path = require('path');

module.exports = {
  control: async ({ action }) => {
    try {
      const map = {
        play: '179', // Next track? No, play/pause is 179
        pause: '179',
        next: '176',
        prev: '177',
        stop: '178'
      };
      const code = map[action];
      if (code) {
        const ps = `powershell -Command "$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]${code})"`;
        exec(ps);
      }
    } catch (e) { console.error('Media control error:', e); }
  },
  volume: async ({ action }) => {
    try {
      const code = action === 'up' ? '175' : action === 'down' ? '174' : '173';
      const ps = `powershell -Command "$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]${code})"`;
      exec(ps);
      return await this.getVolume();
    } catch (e) { console.error('Volume error:', e); }
  },
  getVolume: async () => {
    return new Promise((resolve) => {
      const ps = `powershell -NoProfile -Command "try { $v = (Get-AudioDevice -PlaybackVolume); if ($v -eq $null) { (Get-WmiObject -Query 'Select * from Win32_DesktopMonitor').Volume } $v } catch { (Get-AudioDevice -PlaybackVolume) }"`;
      // Actually the original used a script, I'll copy it or use a simpler PowerShell command
      const simplePs = `powershell -Command "(Get-WmiObject -Class Win32_AudioControl).Volume"`;
      // Let's use the original script logic if possible
      exec(`powershell -Command "(Get-AudioDevice -PlaybackVolume).Replace('%','')"`, (err, stdout) => {
        if (err) resolve({ level: null });
        resolve({ level: parseInt(stdout.trim()) || null });
      });
    });
  }
};
