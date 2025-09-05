@echo off
if not exist node_modules start npm install && timeout /t 5
start npm start
where chrome
if %errorlevel% NEQ 0 (
	start duckduckgo "http://localhost:3000"
) else (
	start chrome ""http://localhost:3000"
)