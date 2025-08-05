#!/usr/bin/env python3
"""
Test script for Security News Aggregator (Python 3.13 Compatible)
Verifies RSS feeds are accessible and parsing correctly without feedparser
"""

import requests
import xml.etree.ElementTree as ET
from html import unescape
import re
import sys
from datetime import datetime

# Current, active security news sources that provide recent updates
SECURITY_FEEDS = {
    "SANS Internet Storm Center": "https://isc.sans.edu/rssfeed.xml",
    "Bleeping Computer": "https://www.bleepingcomputer.com/feed/",
    "The Record by Recorded Future": "https://therecord.media/feed",
    "Security Affairs": "https://securityaffairs.com/feed",
    "Threatpost": "https://threatpost.com/feed/",
    "Dark Reading": "https://www.darkreading.com/rss.xml",
    "Krebs on Security": "https://krebsonsecurity.com/feed/",
    "CISA Alerts": "https://www.cisa.gov/cybersecurity-advisories/all.xml"
}

def test_feed(feed_name, feed_url):
    """Test a single RSS feed using built-in XML parser"""
    print(f"\n📡 Testing {feed_name}...")
    print(f"URL: {feed_url}")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(feed_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ HTTP error: {response.status_code}")
            return False
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Try RSS 2.0 format first
        items = root.findall('.//item')
        if not items:
            # Try Atom format
            items = root.findall('.//{http://www.w3.org/2005/Atom}entry')
            is_atom = True
        else:
            is_atom = False
        
        if len(items) > 0:
            print(f"✅ Success: Found {len(items)} articles")
            
            # Show sample article
            sample = items[0]
            
            if is_atom:
                title_elem = sample.find('.//{http://www.w3.org/2005/Atom}title')
                published_elem = sample.find('.//{http://www.w3.org/2005/Atom}published')
                updated_elem = sample.find('.//{http://www.w3.org/2005/Atom}updated')
                date_text = published_elem.text if published_elem is not None else (updated_elem.text if updated_elem is not None else None)
            else:
                title_elem = sample.find('title')
                published_elem = sample.find('pubDate')
                date_text = published_elem.text if published_elem is not None else None
            
            title = title_elem.text if title_elem is not None else 'No title'
            
            # Clean HTML from title
            title = re.sub(r'<[^>]+>', '', title)
            title = unescape(title)
            
            print(f"   Sample title: {title[:60]}...")
            
            if date_text:
                print(f"   Latest article: {date_text}")
            
            return True
        else:
            print(f"❌ Failed: No articles found")
            return False
            
    except requests.RequestException as e:
        print(f"❌ Network error: {str(e)}")
        return False
    except ET.ParseError as e:
        print(f"❌ XML parse error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("🔍 Security News Aggregator - Feed Testing")
    print("=" * 50)
    
    successful_feeds = 0
    total_feeds = len(SECURITY_FEEDS)
    
    for feed_name, feed_url in SECURITY_FEEDS.items():
        if test_feed(feed_name, feed_url):
            successful_feeds += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {successful_feeds}/{total_feeds} feeds working properly")
    
    if successful_feeds == total_feeds:
        print("🎉 All feeds are working! Ready to start the application.")
        sys.exit(0)
    elif successful_feeds > 0:
        print("⚠️  Some feeds are working. Application will run with available sources.")
        sys.exit(0)
    else:
        print("❌ No feeds are working. Check your internet connection.")
        sys.exit(1)

if __name__ == "__main__":
    main()