@echo off
title CodeMentor
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found on this computer.
  echo   Install the LTS version from https://nodejs.org once, then run this file again.
  echo.
  echo   Alternatively, open app\index.html directly in Chrome or Edge.
  echo   ^(The chat works, but Python/Java/C code cannot be run that way.^)
  echo.
  pause
  exit /b 1
)
node server.js %*
if errorlevel 1 pause
