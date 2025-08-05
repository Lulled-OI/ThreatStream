#!/usr/bin/env python3
"""
Simple test to verify backend dependencies and RSS fetching
"""

print("🧪 Testing Doom Scroll Daily Backend Dependencies...")
print("=" * 50)

# Test 1: Check Python imports
try:
    import flask
    print("✅ Flask imported successfully")
except ImportError as e:
    print(f"❌ Flask import failed: {e}")

try:
    import feedparser
    print("✅ Feedparser imported successfully")
except ImportError as e:
    print(f"❌ Feedparser import failed: {e}")

try:
    import requests
    print("✅ Requests imported successfully")
except ImportError as e:
    print(f"❌ Requests import failed: {e}")

# Test 2: Simple RSS fetch
print("\n📡 Testing RSS feed fetch...")
try:
    import feedparser
    import requests
    
    # Test with a simple, reliable feed
    test_url = "https://krebsonsecurity.com/feed/"
    print(f"Fetching: {test_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(test_url, headers=headers, timeout=10)
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        feed = feedparser.parse(response.content)
        print(f"✅ Feed parsed successfully")
        print(f"   Found {len(feed.entries)} articles")
        
        if len(feed.entries) > 0:
            sample = feed.entries[0]
            print(f"   Sample title: {sample.get('title', 'No title')[:60]}...")
        
    else:
        print(f"❌ HTTP error: {response.status_code}")
        
except Exception as e:
    print(f"❌ RSS test failed: {e}")

# Test 3: Check Flask app creation
print("\n🌐 Testing Flask app creation...")
try:
    from flask import Flask
    test_app = Flask(__name__)
    print("✅ Flask app created successfully")
except Exception as e:
    print(f"❌ Flask app creation failed: {e}")

print("\n" + "=" * 50)
print("🎯 Test complete! If all tests passed, the backend should work.")
print("💡 To start the backend, run: python app.py")
