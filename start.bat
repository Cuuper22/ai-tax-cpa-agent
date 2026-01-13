@echo off
echo ===================================
echo AI Tax CPA Agent - Startup Script
echo ===================================
echo.

if "%ANTHROPIC_API_KEY%"=="" (
    echo WARNING: ANTHROPIC_API_KEY not set
    echo Please set your API key:
    echo set ANTHROPIC_API_KEY=your_key_here
    echo.
)

echo Starting backend...
cd backend
start "Backend" python main.py

echo Waiting for backend to start...
timeout /t 5

echo Starting frontend...
cd ..\frontend
start "Frontend" npm run dev

echo.
echo Application started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause
