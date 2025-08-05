#!/usr/bin/env python3
"""
Simple test for Python 3.13 compatible RSS fetching
"""

print("🧪 Testing Doom Scroll Daily Backend (Python 3.13 Compatible)...")
print("=" * 50)

# Test 1: Check Python imports
try:
    import flask
    print("✅ Flask imported successfully")
except ImportError as e:
    print(f"❌ Flask import failed: {e}")

try:
    import requests
    print("✅ Requests imported successfully")
except ImportError as e:
    print(f"❌ Requests import failed: {e}")

try:
    import xml.etree.ElementTree as ET
    print("✅ XML ElementTree imported successfully")
except ImportError as e:
    print(f"❌ XML ElementTree import failed: {e}")

# Test 2: Simple RSS fetch with custom parser
print("\n📡 Testing RSS feed fetch with custom parser...")
try:
    import requests
    import xml.etree.ElementTree as ET
    from html import unescape
    import re
    from datetime import datetime
    
    # Test with a simple, reliable feed
    test_url = "https://krebsonsecurity.com/feed/"
    print(f"Fetching: {test_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(test_url, headers=headers, timeout=10)
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        # Parse XML
        root = ET.fromstring(response.content)
        items = root.findall('.//item')
        
        print(f"✅ RSS feed parsed successfully")
        print(f"   Found {len(items)} articles")
        
        if len(items) > 0:
            sample = items[0]
            title_elem = sample.find('title')
            title = title_elem.text if title_elem is not None else 'No title'
            
            # Clean HTML from title
            title = re.sub(r'<[^>]+>', '', title)
            title = unescape(title)
            
            print(f"   Sample title: {title[:60]}...")
            
            # Test date parsing
            pub_elem = sample.find('pubDate')
            if pub_elem is not None:
                print(f"   Publication date: {pub_elem.text}")
        
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
print("🎯 Test complete! This version should work with Python 3.13")
print("💡 To start the backend, run: python app.py")
