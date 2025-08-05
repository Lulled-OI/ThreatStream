#!/usr/bin/env python3
"""
Quick RSS feed checker to see which feeds are working
"""

import requests
import xml.etree.ElementTree as ET
from html import unescape
import re
from datetime import datetime

# Current, active security news sources
SECURITY_FEEDS = {
    "SANS Internet Storm Center": "https://isc.sans.edu/rssfeed.xml",
    "Bleeping Computer": "https://www.bleepingcomputer.com/feed/",
    "The Record by Recorded Future": "https://therecord.media/feed",
    "Security Affairs": "https://securityaffairs.com/feed",
    "CISA Cybersecurity Advisories": "https://www.cisa.gov/cybersecurity-advisories/all.xml",  # Back to advisories URL
    "Infosecurity Magazine": "https://www.infosecurity-magazine.com/rss/news/",  # Replace Dark Reading
    "Krebs on Security": "https://krebsonsecurity.com/feed/",
    "Cyber Security News": "https://cybersecuritynews.com/feed/"
}

def quick_test_feed(feed_name, feed_url):
    """Quick test of a single RSS feed"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(feed_url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            return False, f"HTTP {response.status_code}"
        
        # Try to parse XML
        root = ET.fromstring(response.content)
        
        # Check for articles
        items = root.findall('.//item')
        if not items:
            items = root.findall('.//{http://www.w3.org/2005/Atom}entry')
        
        if len(items) > 0:
            return True, f"{len(items)} articles"
        else:
            return False, "No articles found"
        
    except requests.RequestException as e:
        return False, f"Network error: {str(e)}"
    except ET.ParseError as e:
        return False, f"XML parse error: {str(e)}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    print("🔍 Quick RSS Feed Status Check")
    print("=" * 60)
    
    working_feeds = []
    broken_feeds = []
    
    for feed_name, feed_url in SECURITY_FEEDS.items():
        print(f"Testing: {feed_name:<30} ", end="", flush=True)
        
        success, message = quick_test_feed(feed_name, feed_url)
        
        if success:
            print(f"✅ {message}")
            working_feeds.append(feed_name)
        else:
            print(f"❌ {message}")
            broken_feeds.append((feed_name, message))
    
    print("\n" + "=" * 60)
    print(f"📊 Summary: {len(working_feeds)}/{len(SECURITY_FEEDS)} feeds working")
    
    if working_feeds:
        print(f"\n✅ Working feeds ({len(working_feeds)}):")
        for feed in working_feeds:
            print(f"   - {feed}")
    
    if broken_feeds:
        print(f"\n❌ Broken feeds ({len(broken_feeds)}):")
        for feed, error in broken_feeds:
            print(f"   - {feed}: {error}")
    
    print()

if __name__ == "__main__":
    main()
