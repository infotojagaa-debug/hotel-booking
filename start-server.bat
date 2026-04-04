@echo off
title Hotel Booking - Start All Services

echo ============================
echo  Starting MongoDB Service...
echo ============================
net start MongoDB 2>nul
if %errorlevel% neq 0 (
    echo MongoDB service not found. Trying to start mongod directly...
    start /B mongod --dbpath "C:\data\db" 2>nul
)

echo Waiting for MongoDB to initialize (3 seconds)...
timeout /t 3 /nobreak >nul

echo ============================
echo  Starting Backend Server...
echo ============================
cd /d "%~dp0backend"
npm start
