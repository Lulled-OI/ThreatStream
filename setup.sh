#!/bin/bash

# Security News Aggregator Setup Script

echo "🔧 Setting up Security News Aggregator..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.7+ first."
    exit 1
fi

echo "✅ Python 3 found"

# Navigate to backend directory
cd backend

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To run the application:"
echo "1. Backend: cd backend && python app.py"
echo "2. Frontend: Open frontend/index.html in your browser"
echo ""
echo "🌐 The API will be available at: http://localhost:5000"
echo "📊 Open frontend/index.html to view the dashboard"