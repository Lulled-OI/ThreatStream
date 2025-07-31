#!/usr/bin/env python3
"""
Security News Aggregator Backend
Fetches and processes cybersecurity news from multiple RSS sources
"""

import feedparser
import json
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Security news RSS feeds
SECURITY_FEEDS = {
    "Krebs on Security": "https://krebsonsecurity.com/feed/",
    "The Hacker News": "https://feeds.feedburner.com/TheHackersNews",
    "Dark Reading": "https://www.darkreading.com/rss.xml",
    "Security Week": "https://feeds.feedburner.com/securityweek",
    "CISA Alerts": "https://www.cisa.gov/cybersecurity-advisories/all.xml"
}

def fetch_feed_safely(feed_name, feed_url):
    """
    Safely fetch and parse RSS feed with error handling
    Returns parsed feed or None if failed
    """
    try:
        print(f"Fetching {feed_name}...")
        feed = feedparser.parse(feed_url)
        
        if feed.bozo:
            print(f"Warning: {feed_name} may have parsing issues")
        
        return feed
    except Exception as e:
        print(f"Error fetching {feed_name}: {str(e)}")
        return None

def process_feed_entries(feed, source_name, max_entries=10):
    """
    Process feed entries and extract relevant information
    """
    articles = []
    
    if not feed or not hasattr(feed, 'entries'):
        return articles
    
    for entry in feed.entries[:max_entries]:
        try:
            # Parse publication date
            pub_date = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub_date = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                pub_date = datetime(*entry.updated_parsed[:6])
            
            # Extract article data
            article = {
                'title': entry.get('title', 'No Title'),
                'link': entry.get('link', ''),
                'summary': entry.get('summary', entry.get('description', 'No description available')),
                'source': source_name,
                'published': pub_date.isoformat() if pub_date else None,
                'published_readable': pub_date.strftime('%Y-%m-%d %H:%M') if pub_date else 'Unknown'
            }
            
            articles.append(article)
            
        except Exception as e:
            print(f"Error processing entry from {source_name}: {str(e)}")
            continue
    
    return articles

@app.route('/api/news')
def get_security_news():
    """
    API endpoint to fetch aggregated security news
    """
    all_articles = []
    
    for feed_name, feed_url in SECURITY_FEEDS.items():
        feed = fetch_feed_safely(feed_name, feed_url)
        articles = process_feed_entries(feed, feed_name)
        all_articles.extend(articles)
    
    # Sort by publication date (newest first)
    all_articles.sort(key=lambda x: x['published'] or '', reverse=True)
    
    return jsonify({
        'articles': all_articles,
        'total_count': len(all_articles),
        'sources': list(SECURITY_FEEDS.keys()),
        'last_updated': datetime.now().isoformat()
    })

@app.route('/api/sources')
def get_sources():
    """
    API endpoint to get configured news sources
    """
    return jsonify({
        'sources': [
            {'name': name, 'url': url, 'status': 'active'} 
            for name, url in SECURITY_FEEDS.items()
        ]
    })

@app.route('/')
def index():
    """
    Serve basic info page
    """
    return jsonify({
        'message': 'Security News Aggregator API',
        'version': '1.0.0',
        'endpoints': ['/api/news', '/api/sources'],
        'description': 'Cybersecurity news aggregation for risk management'
    })

if __name__ == '__main__':
    print("Starting Security News Aggregator...")
    print(f"Configured sources: {', '.join(SECURITY_FEEDS.keys())}")
    app.run(debug=True, port=5000)