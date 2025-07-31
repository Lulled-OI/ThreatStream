#!/usr/bin/env python3
"""
Quick start script for Security News Aggregator
"""

import subprocess
import sys
import os
import webbrowser
import time
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import feedparser
        import flask
        return True
    except ImportError:
        return False

def main():
    print("🚀 Starting Security News Aggregator...")
    
    # Check if we're in the right directory
    if not os.path.exists('app.py'):
        print("❌ Please run this script from the backend directory")
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependencies not installed. Please run:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    
    print("✅ Dependencies found")
    print("🌐 Starting Flask server...")
    print("📊 Frontend will be available by opening frontend/index.html")
    print("🔗 API available at: http://localhost:5000")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    # Start the Flask app
    try:
        subprocess.run([sys.executable, 'app.py'])
    except KeyboardInterrupt:
        print("\n👋 Shutting down server...")

if __name__ == "__main__":
    main()