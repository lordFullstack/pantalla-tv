@echo off
rem Abre el menu digital en pantalla completa (modo quiosco), sin sonido y con videos automaticos.
rem Doble clic para iniciar. Para cerrar: Alt + F4.
set "PAGINA=file:///%~dp0index.html"
set "PAGINA=%PAGINA:\=/%"

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 "%PAGINA%"
  exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required "%PAGINA%"
  exit /b
)
rem Si no hay Chrome, usa Edge (viene con Windows)
start "" msedge --kiosk "%PAGINA%" --edge-kiosk-type=fullscreen --autoplay-policy=no-user-gesture-required
