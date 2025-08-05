#!/usr/bin/env python3
"""
Debug test for ThreatStream backend setup
"""

print("🧪 Debugging ThreatStream Backend Setup...")
print("=" * 50)

# Test 1: Check Python imports that are actually needed
print("📦 Testing required imports...")
try:
    import flask
    print(f"✅ Flask imported successfully - version {flask.__version__}")
except ImportError as e:
    print(f"❌ Flask import failed: {e}")

try:
    import flask_cors
    print("✅ Flask-CORS imported successfully")
except ImportError as e:
    print(f"❌ Flask-CORS import failed: {e}")

try:
    import requests
    print(f"✅ Requests imported successfully - version {requests.__version__}")
except ImportError as e:
    print(f"❌ Requests import failed: {e}")

try:
    import xml.etree.ElementTree as ET
    print("✅ XML ElementTree imported successfully (built-in)")
except ImportError as e:
    print(f"❌ XML ElementTree import failed: {e}")

try:
    from dotenv import load_dotenv
    print("✅ Python-dotenv imported successfully")
except ImportError as e:
    print(f"❌ Python-dotenv import failed: {e}")

try:
    import anthropic
    print("✅ Anthropic imported successfully")
    print("   (API key required for AI summaries, but not for basic RSS feeds)")
except ImportError as e:
    print(f"❌ Anthropic import failed: {e}")

# Test 2: Simple RSS fetch using built-in XML parser (like the main app)
print("\n📡 Testing RSS feed fetch with built-in XML parser...")
try:
    import requests
    import xml.etree.ElementTree as ET
    
    # Test with Krebs feed (usually reliable)
    test_url = "https://krebsonsecurity.com/feed/"
    print(f"Fetching: {test_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    response = requests.get(test_url, headers=headers, timeout=10)
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        # Parse RSS using ElementTree (same method as main app)
        root = ET.fromstring(response.content)
        items = root.findall('.//item')
        
        print(f"✅ RSS parsed successfully with ElementTree")
        print(f"   Found {len(items)} articles")
        
        if len(items) > 0:
            title_elem = items[0].find('title')
            title = title_elem.text if title_elem is not None else 'No title'
            print(f"   Sample title: {title[:60]}...")
        
    else:
        print(f"❌ HTTP error: {response.status_code}")
        
except Exception as e:
    print(f"❌ RSS test failed: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Check Flask app creation
print("\n🌐 Testing Flask app creation...")
try:
    from flask import Flask
    from flask_cors import CORS
    
    test_app = Flask(__name__)
    CORS(test_app)
    
    @test_app.route('/test')
    def test_route():
        return {'status': 'ok', 'message': 'Test route working'}
    
    print("✅ Flask app with CORS created successfully")
    
except Exception as e:
    print(f"❌ Flask app creation failed: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Check environment file
print("\n📋 Checking environment configuration...")
try:
    from dotenv import load_dotenv
    import os
    
    load_dotenv()
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if api_key and api_key != 'your-api-key-here':
        print("✅ ANTHROPIC_API_KEY is set")
    else:
        print("⚠️  ANTHROPIC_API_KEY not set (AI summaries won't work, but RSS feeds will)")
    
    flask_env = os.getenv('FLASK_ENV', 'production')
    print(f"📊 FLASK_ENV: {flask_env}")
    
except Exception as e:
    print(f"❌ Environment check failed: {e}")

print("\n" + "=" * 50)
print("🎯 Debug test complete!")
print("\n🚀 If most tests passed, try starting the backend with:")
print("   python app.py")
print("\n💡 If there are import errors, try reinstalling:")
print("   pip install -r requirements.txt")
