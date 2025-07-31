#!/usr/bin/env python3
"""
Test script for Security News Aggregator
Verifies RSS feeds are accessible and parsing correctly
"""

import feedparser
import sys
from datetime import datetime

# Same feeds as in main app
SECURITY_FEEDS = {
    "Krebs on Security": "https://krebsonsecurity.com/feed/",
    "The Hacker News": "https://feeds.feedburner.com/TheHackersNews",
    "Dark Reading": "https://www.darkreading.com/rss.xml",
    "Security Week": "https://feeds.feedburner.com/securityweek",
    "CISA Alerts": "https://www.cisa.gov/cybersecurity-advisories/all.xml"
}

def test_feed(feed_name, feed_url):
    """Test a single RSS feed"""
    print(f"\n📡 Testing {feed_name}...")
    print(f"URL: {feed_url}")
    
    try:
        feed = feedparser.parse(feed_url)
        
        if feed.bozo:
            print(f"⚠️  Warning: Feed may have parsing issues")
        
        if hasattr(feed, 'entries') and len(feed.entries) > 0:
            print(f"✅ Success: Found {len(feed.entries)} articles")
            
            # Show sample article
            sample = feed.entries[0]
            print(f"   Sample title: {sample.get('title', 'No title')[:60]}...")
            
            # Check for date
            if hasattr(sample, 'published_parsed') and sample.published_parsed:
                pub_date = datetime(*sample.published_parsed[:6])
                print(f"   Latest article: {pub_date.strftime('%Y-%m-%d %H:%M')}")
            
            return True
        else:
            print(f"❌ Failed: No articles found")
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