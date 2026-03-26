@echo off
setlocal
ssh root@43.132.224.154 "cd /var/www/choose-dish-app && git pull && npm run db:init && npm run build && pm2 restart choose-dish-app && pm2 status"
exit /b %ERRORLEVEL%
