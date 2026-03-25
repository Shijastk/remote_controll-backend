@echo off
echo Building PC Remote Desktop App...
npm run build-exe
if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Your app is ready in the 'dist' folder.
    echo Double-click 'pc-remote.exe' to start.
) else (
    echo.
    echo ERROR: Failed to build. Make sure Node.js is installed.
)
pause
