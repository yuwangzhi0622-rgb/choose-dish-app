@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0release-and-deploy.ps1" %*
exit /b %ERRORLEVEL%
