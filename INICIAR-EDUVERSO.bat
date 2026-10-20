@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instala Node.js 20 o posterior y vuelve a intentarlo.
  pause
  exit /b 1
)
echo Iniciando Eduverso. Mantén esta ventana abierta mientras uses la página.
echo Cuando aparezca el mensaje del servidor, abre http://localhost:3000
npm start
pause
