@echo off
echo ========================================
echo  Gestor de Facturacion - Reinstalacion
echo ========================================
echo.
echo Borrando node_modules y package-lock...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo.
echo Instalando dependencias compatibles con Node.js 20.9...
npm install
echo.
echo Listo. Ahora podes correr:
echo   npm run dev
echo.
pause
