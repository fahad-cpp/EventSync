@echo off
REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    call npm install
	timeout /t 10 /nobreak >nul
)

start "Server" npm start
set "URL=http://localhost:3000"
start "" "%URL%"
