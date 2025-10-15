@echo off
echo Setting up MR Alignment project...

echo.
echo 1. Creating frontend environment file...
copy "env.example" ".env" >nul 2>&1
if exist ".env" (
    echo ✓ Frontend .env file created successfully
) else (
    echo ✗ Failed to create frontend .env file
)

echo.
echo 2. Starting development environment...
echo Please run the following commands in separate terminals:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   php artisan serve --host=0.0.0.0 --port=8000
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm install
echo   npm run dev
echo.
echo Terminal 3 (Database - if using Docker):
echo   docker-compose up postgres
echo.
echo The application will be available at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo.
echo Press any key to continue...
pause >nul
