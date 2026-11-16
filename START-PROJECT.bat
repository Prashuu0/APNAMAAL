@echo off
echo ========================================
echo    ApnaMaal - Starting Full Stack App
echo ========================================
echo.

echo Step 1: Check MongoDB is running...
echo Make sure MongoDB is running on mongodb://localhost:27017/
echo Press any key to continue...
pause >nul

echo.
echo Step 2: Starting Backend Server (Port 3001)...
start "ApnaMaal Backend" cmd /k "cd server && npm install && npm run dev"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 3: Seeding Database (first time only)...
cd server
node seed.js
cd ..

echo.
echo Step 4: Starting Frontend (Port 5173)...
start "ApnaMaal Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo    ✅ Server started successfully!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo API: http://localhost:3001/api
echo.
echo Press any key to exit...
pause >nul

