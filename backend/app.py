#!/usr/bin/env python3
"""
Security News Aggregator Backend - Python 3.13 Compatible
Fetches and processes cybersecurity news from multiple RSS sources
"""

import json
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template
from flask_cors import CORS
import re

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

def clean_html(raw_html):
    """Remove HTML tags from text"""
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()

def parse_rss_feed(feed_url):
    """
    Parse RSS feed manually using requests and xml.etree
    Python 3.13 compatible alternative to feedparser
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(feed_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Find channel and items
        items = []
        
        # Handle both RSS and Atom feeds
        if root.tag == 'rss':
            # RSS format
            for item in root.findall('.//item'):
                entry = {}
                
                title_elem = item.find('title')
                entry['title'] = title_elem.text if title_elem is not None else 'No Title'
                
                link_elem = item.find('link')
                entry['link'] = link_elem.text if link_elem is not None else ''
                
                desc_elem = item.find('description')
                if desc_elem is not None:
                    entry['description'] = clean_html(desc_elem.text)
                else:
                    entry['description'] = 'No description available'
                
                # Try different date fields
                pub_date = item.find('pubDate')
                if pub_date is not None:
                    entry['pub_date'] = pub_date.text
                
                items.append(entry)
                
        elif root.tag.endswith('feed'):
            # Atom format
            for entry_elem in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                entry = {}
                
                title_elem = entry_elem.find('.//{http://www.w3.org/2005/Atom}title')
                entry['title'] = title_elem.text if title_elem is not None else 'No Title'
                
                link_elem = entry_elem.find('.//{http://www.w3.org/2005/Atom}link')
                if link_elem is not None:
                    entry['link'] = link_elem.get('href', '')
                
                summary_elem = entry_elem.find('.//{http://www.w3.org/2005/Atom}summary')
                if summary_elem is not None:
                    entry['description'] = clean_html(summary_elem.text)
                else:
                    entry['description'] = 'No description available'
                
                updated_elem = entry_elem.find('.//{http://www.w3.org/2005/Atom}updated')
                if updated_elem is not None:
                    entry['pub_date'] = updated_elem.text
                
                items.append(entry)
        
        return items[:10]  # Limit to 10 items per feed
        
    except Exception as e:
        print(f"Error parsing feed {feed_url}: {str(e)}")
        return []

def fetch_feed_safely(feed_name, feed_url):
    """
    Safely fetch and parse RSS feed with error handling
    """
    try:
        print(f"Fetching {feed_name}...")
        return parse_rss_feed(feed_url)
    except Exception as e:
        print(f"Error fetching {feed_name}: {str(e)}")
        return []

def process_feed_entries(items, source_name):
    """
    Process feed entries and extract relevant information
    """
    articles = []
    
    for item in items:
        try:
            # Parse publication date if available
            pub_date = None
            pub_readable = 'Unknown'
            
            if 'pub_date' in item and item['pub_date']:
                try:
                    # Try to parse common date formats
                    date_str = item['pub_date']
                    
                    # Remove timezone info for simpler parsing
                    date_str = re.sub(r'\s*[+-]\d{4}|\s*[A-Z]{3,4}$', '', date_str)
                    
                    for fmt in ['%a, %d %b %Y %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                        try:
                            pub_date = datetime.strptime(date_str.strip(), fmt)
                            pub_readable = pub_date.strftime('%Y-%m-%d %H:%M')
                            break
                        except ValueError:
                            continue
                except:
                    pass
            
            # Extract article data
            article = {
                'title': item.get('title', 'No Title'),
                'link': item.get('link', ''),
                'summary': item.get('description', 'No description available')[:300] + '...',
                'source': source_name,
                'published': pub_date.isoformat() if pub_date else None,
                'published_readable': pub_readable
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
        items = fetch_feed_safely(feed_name, feed_url)
        articles = process_feed_entries(items, feed_name)
        all_articles.extend(articles)
    
    # Sort by publication date (newest first)
    all_articles.sort(key=lambda x: x['published'] or '2000-01-01', reverse=True)
    
    # Add some mock statistics for the dashboard
    total_count = len(all_articles)
    sources = list(SECURITY_FEEDS.keys())
    
    response_data = {
        'articles': all_articles,
        'total_count': total_count,
        'sources': sources,
        'last_updated': datetime.now().isoformat(),
        'status': 'success',
        'threat_level': 'MEDIUM',  # Could be calculated based on articles
        'stats': {
            'critical': 0,  # These could be calculated from article analysis
            'high': total_count // 4,
            'medium': total_count // 2,
            'low': total_count // 4
        }
    }
    
    print(f"API Response: Found {total_count} articles from {len(sources)} sources")
    
    return jsonify(response_data)

@app.route('/api/test')
def test_api():
    """
    Simple test endpoint to verify API is working
    """
    return jsonify({
        'status': 'API is working',
        'timestamp': datetime.now().isoformat(),
        'message': 'ThreatStream backend is operational'
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
        'message': 'ThreatStream API',
        'version': '1.0.0',
        'endpoints': ['/api/news', '/api/sources'],
        'description': 'Cybersecurity news aggregation for threat monitoring',
        'python_version': 'Compatible with Python 3.13+'
    })

if __name__ == '__main__':
    print("Starting ThreatStream...")
    print(f"Configured sources: {', '.join(SECURITY_FEEDS.keys())}")
    print("Python 3.13 compatible version")
    app.run(debug=True, port=5000)