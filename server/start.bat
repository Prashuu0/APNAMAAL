@echo off
echo Installing dependencies...
call npm install

echo.
echo Starting MongoDB connection check...
echo Make sure MongoDB is running on mongodb://localhost:27017/
echo.

echo Starting server...
call npm run dev

