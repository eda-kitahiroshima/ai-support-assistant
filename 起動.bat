@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ====================================
echo Webアプリ開発サーバー起動中...
echo ====================================
echo.
echo ブラウザで http://localhost:3000 を開いてください
echo.
call npm run dev
pause
