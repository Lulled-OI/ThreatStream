#!/usr/bin/env python3
"""
Doom Scroll Daily Backend - AI Summary Service
Flask backend with Claude API integration for threat intelligence summaries
"""

import os
import json
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
from functools import wraps
import requests
from urllib.parse import urljoin
import xml.etree.ElementTree as ET
from html import unescape
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# In-memory cache for AI summaries (24 hour expiry)
summary_cache = {}
CACHE_EXPIRY_HOURS = 24

# RSS feed cache (refresh every 30 minutes)
feed_cache = {}
FEED_CACHE_MINUTES = 30

# Current, active security news sources that provide recent updates
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

# Initialize Claude client
anthropic_client = None

def init_claude_client():
    """Initialize the Claude API client with API key"""
    global anthropic_client
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("⚠️  WARNING: ANTHROPIC_API_KEY environment variable not set!")
        print("📋 To set up Claude API:")
        print("   1. Get API key from: https://console.anthropic.com/")
        print("   2. Set environment variable: export ANTHROPIC_API_KEY='your-key-here'")
        print("   3. Or create .env file with: ANTHROPIC_API_KEY=your-key-here")
        return False
    
    try:
        anthropic_client = anthropic.Anthropic(api_key=api_key)
        print("✅ Claude API client initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Claude client: {e}")
        return False

def requires_claude(f):
    """Decorator to ensure Claude client is available"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if anthropic_client is None:
            return jsonify({
                'error': 'Claude API not configured',
                'message': 'Please set ANTHROPIC_API_KEY environment variable'
            }), 503
        return f(*args, **kwargs)
    return decorated_function

def is_cache_valid(timestamp):
    """Check if cached summary is still valid (within 24 hours)"""
    expiry_time = datetime.fromisoformat(timestamp) + timedelta(hours=CACHE_EXPIRY_HOURS)
    return datetime.now() < expiry_time

def clean_expired_cache():
    """Remove expired entries from cache"""
    global summary_cache
    current_time = datetime.now()
    expired_keys = []
    
    for key, data in summary_cache.items():
        expiry_time = datetime.fromisoformat(data['timestamp']) + timedelta(hours=CACHE_EXPIRY_HOURS)
        if current_time >= expiry_time:
            expired_keys.append(key)
    
    for key in expired_keys:
        del summary_cache[key]
    
    if expired_keys:
        print(f"🧹 Cleaned {len(expired_keys)} expired cache entries")

def is_feed_cache_valid(timestamp):
    """Check if cached feed data is still valid (within 30 minutes)"""
    expiry_time = datetime.fromisoformat(timestamp) + timedelta(minutes=FEED_CACHE_MINUTES)
    return datetime.now() < expiry_time

def clean_expired_feed_cache():
    """Remove expired RSS feed cache entries"""
    global feed_cache
    current_time = datetime.now()
    expired_keys = []
    
    for key, data in feed_cache.items():
        expiry_time = datetime.fromisoformat(data['timestamp']) + timedelta(minutes=FEED_CACHE_MINUTES)
        if current_time >= expiry_time:
            expired_keys.append(key)
    
    for key in expired_keys:
        del feed_cache[key]
    
    if expired_keys:
        print(f"🧹 Cleaned {len(expired_keys)} expired feed cache entries")

def fetch_single_feed(feed_name, feed_url, timeout=20, retries=2):
    """Fetch and parse a single RSS feed using built-in XML parser with retry logic"""
    last_error = None
    
    for attempt in range(retries + 1):
        try:
            print(f"📡 Fetching {feed_name}... (attempt {attempt + 1})")
            
            # Set better user agent and headers to avoid blocking
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            }
            
            # Fetch with longer timeout
            response = requests.get(feed_url, headers=headers, timeout=timeout, allow_redirects=True)
            response.raise_for_status()
            
            # Parse RSS using ElementTree
            root = ET.fromstring(response.content)
            
            # Handle different RSS formats (RSS 2.0, Atom, etc.)
            articles = []
            
            # Try RSS 2.0 format first
            items = root.findall('.//item')
            if not items:
                # Try Atom format
                items = root.findall('.//{http://www.w3.org/2005/Atom}entry')
                is_atom = True
            else:
                is_atom = False
            
            for item in items[:10]:  # Limit to 10 most recent
                if is_atom:
                    # Atom format
                    title_elem = item.find('.//{http://www.w3.org/2005/Atom}title')
                    summary_elem = item.find('.//{http://www.w3.org/2005/Atom}summary')
                    link_elem = item.find('.//{http://www.w3.org/2005/Atom}link')
                    published_elem = item.find('.//{http://www.w3.org/2005/Atom}published')
                    updated_elem = item.find('.//{http://www.w3.org/2005/Atom}updated')
                    
                    title = title_elem.text if title_elem is not None else 'No title'
                    summary = summary_elem.text if summary_elem is not None else ''
                    link = link_elem.get('href') if link_elem is not None else ''
                    
                    # Get publication date
                    date_text = None
                    if published_elem is not None:
                        date_text = published_elem.text
                    elif updated_elem is not None:
                        date_text = updated_elem.text
                        
                else:
                    # RSS 2.0 format
                    title_elem = item.find('title')
                    summary_elem = item.find('description')
                    link_elem = item.find('link')
                    published_elem = item.find('pubDate')
                    
                    title = title_elem.text if title_elem is not None else 'No title'
                    summary = summary_elem.text if summary_elem is not None else ''
                    link = link_elem.text if link_elem is not None else ''
                    
                    date_text = published_elem.text if published_elem is not None else None
                
                # Parse publication date
                pub_date = parse_date(date_text) if date_text else datetime.now()
                
                # Clean HTML from summary
                if summary:
                    summary = clean_html(summary)
                    if len(summary) > 300:
                        summary = summary[:297] + '...'
                
                # Clean HTML from title
                if title:
                    title = clean_html(title)
                
                article = {
                    'id': f"{feed_name.lower().replace(' ', '_')}_{len(articles)}",
                    'title': title,
                    'summary': summary,
                    'link': link,
                    'source': feed_name,
                    'published': pub_date.isoformat(),
                    'published_ago': get_time_ago(pub_date)
                }
                articles.append(article)
            
            print(f"✅ {feed_name}: Found {len(articles)} articles")
            return articles
            
        except requests.RequestException as e:
            last_error = f"Network error: {str(e)}"
            if attempt < retries:
                print(f"⚠️ {feed_name}: {last_error} - retrying...")
                time.sleep(2)  # Wait before retry
                continue
        except ET.ParseError as e:
            last_error = f"XML parse error: {str(e)}"
            if attempt < retries:
                print(f"⚠️ {feed_name}: {last_error} - retrying...")
                time.sleep(2)
                continue
        except Exception as e:
            last_error = f"Parse error: {str(e)}"
            if attempt < retries:
                print(f"⚠️ {feed_name}: {last_error} - retrying...")
                time.sleep(2)
                continue
    
    # If we get here, all retries failed
    print(f"❌ {feed_name}: Failed after {retries + 1} attempts - {last_error}")
    return []

def clean_html(text):
    """Remove HTML tags and decode HTML entities"""
    if not text:
        return ''
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Decode HTML entities
    text = unescape(text)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def parse_date(date_string):
    """Parse various date formats from RSS feeds and normalize to timezone-naive"""
    if not date_string:
        return datetime.now()
    
    # Common RSS date formats
    formats = [
        '%a, %d %b %Y %H:%M:%S %z',  # RFC 822 with timezone
        '%a, %d %b %Y %H:%M:%S %Z',  # RFC 822 with timezone name
        '%a, %d %b %Y %H:%M:%S',     # RFC 822 without timezone
        '%Y-%m-%dT%H:%M:%S%z',       # ISO 8601 with timezone
        '%Y-%m-%dT%H:%M:%SZ',        # ISO 8601 UTC
        '%Y-%m-%dT%H:%M:%S',         # ISO 8601 without timezone
        '%Y-%m-%d %H:%M:%S',         # Simple format
        '%Y-%m-%d',                  # Date only
    ]
    
    for fmt in formats:
        try:
            parsed_date = datetime.strptime(date_string.strip(), fmt)
            
            # If the parsed date has timezone info, convert to naive
            if parsed_date.tzinfo is not None:
                # Convert to UTC first, then make naive
                utc_tuple = parsed_date.utctimetuple()
                parsed_date = datetime(*utc_tuple[:6])
            
            return parsed_date
            
        except ValueError:
            continue
    
    # If all else fails, return current time
    print(f"⚠️  Could not parse date: {date_string}")
    return datetime.now()

def get_time_ago(pub_date):
    """Calculate human-readable time ago"""
    # Make sure both dates are timezone-naive for comparison
    now = datetime.now()
    
    # If pub_date has timezone info, convert to naive
    if pub_date.tzinfo is not None:
        # Convert to UTC first, then make naive
        pub_date_naive = pub_date.utctimetuple()
        pub_date = datetime(*pub_date_naive[:6])
    
    diff = now - pub_date
    
    if diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours}h ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes}m ago"
    else:
        return "Just now"

def fetch_all_feeds():
    """Fetch articles from all RSS feeds"""
    print("🔄 Fetching all RSS feeds...")
    all_articles = []
    successful_feeds = 0
    
    for feed_name, feed_url in SECURITY_FEEDS.items():
        articles = fetch_single_feed(feed_name, feed_url)
        if articles:
            all_articles.extend(articles)
            successful_feeds += 1
    
    # Sort by publication date (newest first)
    all_articles.sort(key=lambda x: x['published'], reverse=True)
    
    print(f"📊 Successfully fetched from {successful_feeds}/{len(SECURITY_FEEDS)} feeds")
    print(f"📰 Total articles: {len(all_articles)}")
    
    return {
        'articles': all_articles,
        'successful_feeds': successful_feeds,
        'total_feeds': len(SECURITY_FEEDS),
        'sources': list(SECURITY_FEEDS.keys())
    }

def generate_threat_summary(article_data):
    """Generate AI summary using Claude API for threat intelligence context"""
    
    # Create a comprehensive prompt for SOC analysts
    prompt = f"""You are a cybersecurity analyst creating a threat intelligence brief for a Security Operations Center (SOC). 

Analyze this threat report and provide a structured summary focused on actionable intelligence:

**THREAT DETAILS:**
- Title: {article_data.get('title', 'N/A')}
- Source: {article_data.get('source', 'N/A')}
- Severity: {article_data.get('severity', 'N/A')}
- CVSS Score: {article_data.get('cvss', 'N/A')}
- Summary: {article_data.get('summary', 'N/A')}
- Threat Tags: {', '.join(article_data.get('threats', []))}

**REQUIRED OUTPUT FORMAT:**
Provide a structured analysis in HTML format with these sections:

<h4>🎯 Threat Overview</h4>
<p>[2-3 sentence executive summary of the threat]</p>

<h4>⚔️ Attack Vector</h4>
<ul>
<li><strong>Method:</strong> [How the attack works]</li>
<li><strong>Entry Point:</strong> [How attackers gain access]</li>
<li><strong>Exploitation:</strong> [What vulnerability is exploited]</li>
</ul>

<h4>🏢 Affected Systems</h4>
<ul>
<li><strong>Target Platforms:</strong> [OS, software, services affected]</li>
<li><strong>Industries at Risk:</strong> [Specific sectors targeted]</li>
<li><strong>Asset Types:</strong> [Servers, endpoints, networks, etc.]</li>
</ul>

<h4>📊 Risk Assessment</h4>
<ul>
<li><strong>Severity Level:</strong> [Critical/High/Medium/Low with rationale]</li>
<li><strong>Exploitability:</strong> [Easy/Moderate/Difficult]</li>
<li><strong>Business Impact:</strong> [Data loss, downtime, financial impact]</li>
</ul>

<h4>🛡️ Recommended Actions</h4>
<ul>
<li><strong>Immediate:</strong> [Actions to take within 24 hours]</li>
<li><strong>Short-term:</strong> [Actions within 1 week]</li>
<li><strong>Long-term:</strong> [Strategic improvements]</li>
</ul>

<h4>🔍 Indicators of Compromise (IOCs)</h4>
<ul>
<li><strong>Technical Indicators:</strong> [File hashes, IPs, domains if mentioned]</li>
<li><strong>Behavioral Indicators:</strong> [Suspicious activities to monitor]</li>
<li><strong>Detection Rules:</strong> [SIEM/EDR rules to implement]</li>
</ul>

Focus on practical, actionable intelligence that SOC analysts can immediately use to protect their environment."""

    try:
        # Call Claude API
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",  # Using Haiku for speed and cost efficiency
            max_tokens=1500,
            temperature=0.3,  # Lower temperature for more consistent, factual responses
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.content[0].text
        
    except Exception as e:
        print(f"❌ Claude API error: {e}")
        raise

@app.route('/api/feeds', methods=['GET'])
def get_feeds():
    """Get aggregated security news from all RSS feeds"""
    global feed_cache
    
    # Clean expired feed cache
    clean_expired_feed_cache()
    
    # Check if we have cached data
    cache_key = 'all_feeds'
    if cache_key in feed_cache and is_feed_cache_valid(feed_cache[cache_key]['timestamp']):
        print("📋 Returning cached RSS feed data")
        cached_data = feed_cache[cache_key]
        return jsonify({
            'success': True,
            'cached': True,
            'cache_age_minutes': (datetime.now() - datetime.fromisoformat(cached_data['timestamp'])).seconds // 60,
            **cached_data['data']
        })
    
    try:
        # Fetch fresh data
        print("🔄 Fetching fresh RSS data...")
        start_time = time.time()
        
        feed_data = fetch_all_feeds()
        
        fetch_time = time.time() - start_time
        timestamp = datetime.now().isoformat()
        
        # Cache the data
        feed_cache[cache_key] = {
            'data': feed_data,
            'timestamp': timestamp,
            'fetch_time': fetch_time
        }
        
        return jsonify({
            'success': True,
            'cached': False,
            'fetch_time': fetch_time,
            'fetched_at': timestamp,
            **feed_data
        })
        
    except Exception as e:
        print(f"❌ Error fetching feeds: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch RSS feeds',
            'message': str(e)
        }), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify backend is running"""
    return jsonify({
        'status': 'ok',
        'message': 'Doom Scroll Daily backend is running',
        'claude_configured': anthropic_client is not None,
        'cache_entries': len(summary_cache),
        'feed_cache_entries': len(feed_cache),
        'total_feeds': len(SECURITY_FEEDS),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/daily-brief', methods=['POST'])
@requires_claude
def generate_daily_brief():
    """Generate comprehensive daily threat intelligence brief"""
    
    # Clean expired cache entries periodically
    clean_expired_cache()
    
    try:
        # Get request data
        request_data = request.get_json()
        
        if not request_data or 'articles' not in request_data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        articles = request_data['articles']
        date = request_data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # Create cache key based on date and article count
        cache_key = f"daily_brief_{date}_{len(articles)}"
        
        # Check cache first
        if cache_key in summary_cache:
            cached_data = summary_cache[cache_key]
            if is_cache_valid(cached_data['timestamp']):
                print(f"📋 Returning cached daily brief for {date}")
                return jsonify({
                    'summary': cached_data['summary'],
                    'cached': True,
                    'generated_at': cached_data['timestamp'],
                    'date': date
                })
            else:
                del summary_cache[cache_key]
        
        # Generate new daily brief
        print(f"🤖 Generating daily threat brief for {date} ({len(articles)} articles)")
        start_time = time.time()
        
        brief = generate_daily_threat_brief(request_data)
        
        generation_time = time.time() - start_time
        timestamp = datetime.now().isoformat()
        
        # Cache the brief
        summary_cache[cache_key] = {
            'summary': brief,
            'timestamp': timestamp,
            'generation_time': generation_time
        }
        
        print(f"✅ Generated daily brief for {date} in {generation_time:.2f}s")
        
        return jsonify({
            'summary': brief,
            'cached': False,
            'generated_at': timestamp,
            'generation_time': generation_time,
            'date': date
        })
        
    except anthropic.APIError as e:
        print(f"❌ Claude API error: {e}")
        return jsonify({
            'error': 'AI service unavailable',
            'message': 'Unable to generate daily brief at this time'
        }), 503
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500

def generate_daily_threat_brief(request_data):
    """Generate comprehensive daily threat landscape analysis using Claude API"""
    
    articles = request_data['articles']
    date = request_data.get('date', datetime.now().strftime('%Y-%m-%d'))
    total_threats = request_data.get('total_threats', len(articles))
    severity_breakdown = request_data.get('severity_breakdown', {})
    
    # Prepare article summaries for analysis
    article_summaries = []
    for article in articles:
        article_summaries.append(f"""
• **{article.get('severity', 'unknown').upper()}** | {article.get('source', 'Unknown')} | CVSS {article.get('cvss', 'N/A')}
  **{article.get('title', 'No title')}**
  {article.get('summary', 'No summary available')}
  Threats: {', '.join(article.get('threats', []))}
        """)
    
    # Create comprehensive prompt for daily brief
    prompt = f"""You are the Chief Information Security Officer (CISO) creating a comprehensive daily threat intelligence briefing for senior leadership and SOC teams.

**BRIEFING DATE:** {date}
**TOTAL THREAT REPORTS:** {total_threats}
**SEVERITY BREAKDOWN:**
- Critical: {severity_breakdown.get('critical', 0)}
- High: {severity_breakdown.get('high', 0)} 
- Medium: {severity_breakdown.get('medium', 0)}
- Low: {severity_breakdown.get('low', 0)}

**TODAY'S THREAT INTELLIGENCE:**
{''.join(article_summaries)}

**REQUIRED OUTPUT FORMAT:**
Provide an executive-level threat intelligence brief in HTML format with these sections:

<h4>🎯 Executive Summary</h4>
<p>[2-3 sentence overview of today's threat landscape and key concerns]</p>

<h4>📊 Threat Landscape Analysis</h4>
<ul>
<li><strong>Primary Risk Level:</strong> [Critical/High/Medium/Low with rationale]</li>
<li><strong>Dominant Threat Vectors:</strong> [Most common attack methods today]</li>
<li><strong>Geographic/Industry Focus:</strong> [Targeted regions or sectors]</li>
<li><strong>Notable Threat Actors:</strong> [APT groups, ransomware families mentioned]</li>
</ul>

<h4>🔥 Top 3 Critical Issues</h4>
<ul>
<li><strong>1. [Most critical threat]:</strong> [Brief description and immediate concern]</li>
<li><strong>2. [Second priority]:</strong> [Brief description and impact]</li>
<li><strong>3. [Third priority]:</strong> [Brief description and implications]</li>
</ul>

<h4>📈 Emerging Trends & Patterns</h4>
<ul>
<li><strong>New Attack Techniques:</strong> [Novel methods or TTPs observed]</li>
<li><strong>Supply Chain Risks:</strong> [Third-party or software supply chain threats]</li>
<li><strong>Infrastructure Targeting:</strong> [Critical infrastructure or cloud services at risk]</li>
<li><strong>Zero-Day Activity:</strong> [New vulnerabilities or exploitation trends]</li>
</ul>

<h4>🛡️ Strategic Recommendations</h4>
<ul>
<li><strong>Immediate Actions (Next 24h):</strong> [Urgent security measures]</li>
<li><strong>Short-term Focus (Next Week):</strong> [Priority security initiatives]</li>
<li><strong>Resource Allocation:</strong> [Where to focus security team efforts]</li>
<li><strong>Executive Decisions Needed:</strong> [Items requiring leadership attention]</li>
</ul>

<h4>🔍 Key Indicators to Monitor</h4>
<ul>
<li><strong>Technical IOCs:</strong> [File hashes, domains, IPs to watch]</li>
<li><strong>Behavioral Indicators:</strong> [Suspicious activities to detect]</li>
<li><strong>Threat Intelligence Sources:</strong> [Key feeds to prioritize today]</li>
<li><strong>External Factors:</strong> [Geopolitical or industry events affecting threat landscape]</li>
</ul>

<h4>📞 Stakeholder Actions Required</h4>
<ul>
<li><strong>IT Operations:</strong> [Actions for infrastructure teams]</li>
<li><strong>Security Teams:</strong> [SOC and incident response priorities]</li>
<li><strong>Business Units:</strong> [User awareness or process changes needed]</li>
<li><strong>Executive Team:</strong> [Strategic decisions or communications required]</li>
</ul>

Focus on actionable intelligence that enables informed security decisions at all organizational levels. Emphasize business impact and risk-based prioritization."""

    try:
        # Call Claude API with longer response for comprehensive brief
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=2500,  # Longer response for comprehensive brief
            temperature=0.2,  # Lower temperature for consistent, factual analysis
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.content[0].text
        
    except Exception as e:
        print(f"❌ Claude API error in daily brief: {e}")
        raise

@app.route('/api/summarize', methods=['POST'])
@requires_claude
def summarize_threat():
    """Generate AI summary for a threat intelligence article"""
    
    # Clean expired cache entries periodically
    clean_expired_cache()
    
    try:
        # Get article data from request
        article_data = request.get_json()
        
        if not article_data or 'id' not in article_data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        article_id = article_data['id']
        
        # Check cache first
        if article_id in summary_cache:
            cached_data = summary_cache[article_id]
            if is_cache_valid(cached_data['timestamp']):
                print(f"📋 Returning cached summary for {article_id}")
                return jsonify({
                    'summary': cached_data['summary'],
                    'cached': True,
                    'generated_at': cached_data['timestamp']
                })
            else:
                # Remove expired cache entry
                del summary_cache[article_id]
        
        # Generate new summary
        print(f"🤖 Generating new AI summary for {article_id}")
        start_time = time.time()
        
        summary = generate_threat_summary(article_data)
        
        generation_time = time.time() - start_time
        timestamp = datetime.now().isoformat()
        
        # Cache the summary
        summary_cache[article_id] = {
            'summary': summary,
            'timestamp': timestamp,
            'generation_time': generation_time
        }
        
        print(f"✅ Generated summary for {article_id} in {generation_time:.2f}s")
        
        return jsonify({
            'summary': summary,
            'cached': False,
            'generated_at': timestamp,
            'generation_time': generation_time
        })
        
    except anthropic.APIError as e:
        print(f"❌ Claude API error: {e}")
        return jsonify({
            'error': 'AI service unavailable',
            'message': 'Unable to generate summary at this time'
        }), 503
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    clean_expired_cache()
    
    total_entries = len(summary_cache)
    cache_data = []
    
    for article_id, data in summary_cache.items():
        cache_data.append({
            'article_id': article_id,
            'timestamp': data['timestamp'],
            'generation_time': data.get('generation_time', 0),
            'is_valid': is_cache_valid(data['timestamp'])
        })
    
    return jsonify({
        'total_entries': total_entries,
        'cache_expiry_hours': CACHE_EXPIRY_HOURS,
        'entries': cache_data
    })

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear all cached summaries"""
    global summary_cache
    cleared_count = len(summary_cache)
    summary_cache = {}
    
    print(f"🧹 Cleared {cleared_count} cache entries")
    
    return jsonify({
        'message': f'Cleared {cleared_count} cache entries',
        'cleared_count': cleared_count
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting Doom Scroll Daily Backend...")
    print("=" * 50)
    
    # Initialize Claude client
    claude_ready = init_claude_client()
    
    if not claude_ready:
        print("\n⚠️  Backend will start but AI summaries will not work without Claude API key")
    
    print(f"\n📰 RSS Feed Sources ({len(SECURITY_FEEDS)} configured):")
    for source in SECURITY_FEEDS.keys():
        print(f"   - {source}")
    
    print(f"\n📊 Cache settings:")
    print(f"   - AI Summary cache: {CACHE_EXPIRY_HOURS} hours")
    print(f"   - RSS feed cache: {FEED_CACHE_MINUTES} minutes")
    print(f"   - Storage: In-memory (resets on restart)")
    
    print(f"\n🌐 API Endpoints:")
    print(f"   - GET  /api/test           - Health check")
    print(f"   - GET  /api/feeds          - Get current RSS feeds (MAIN ENDPOINT)")
    print(f"   - POST /api/daily-brief    - Generate daily threat brief")
    print(f"   - POST /api/summarize      - Generate AI summary")
    print(f"   - GET  /api/cache/stats    - Cache statistics")
    print(f"   - POST /api/cache/clear    - Clear cache")
    
    print(f"\n🔗 Frontend should connect to: http://localhost:5001")
    print("=" * 50)
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True
    )
