@echo off
start "Word Quiz App" cmd /k "cd /d C:\Personal\kbj\Code\word-quiz-app && npm run dev"
timeout /t 5 /nobreak > nul
start http://localhost:3000
exit
