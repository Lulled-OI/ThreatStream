@echo off
echo 🔧 Setting up Security News Aggregator...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is required but not installed. Please install Python 3.7+ first.
    pause
    exit /b 1
)

echo ✅ Python 3 found

REM Navigate to backend directory
cd backend

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing Python dependencies...
pip install -r requirements.txt

echo.
echo 🎉 Setup complete!
echo.
echo To run the application:
echo 1. Backend: cd backend ^&^& python app.py
echo 2. Frontend: Open frontend\index.html in your browser
echo.
echo 🌐 The API will be available at: http://localhost:5000
echo 📊 Open frontend\index.html to view the dashboard

pause