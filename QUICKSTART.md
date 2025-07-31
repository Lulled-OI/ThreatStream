# Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Test RSS Feeds (Optional)
```bash
python test_feeds.py
```

### Step 3: Start the Backend
```bash
python app.py
```
*Server runs on http://localhost:5000*

### Step 4: Open Frontend
- Navigate to `frontend/index.html`
- Open in your browser
- News should load automatically!

## 🛠️ Development Workflow

1. **Make changes** to backend code
2. **Restart** the Flask server
3. **Refresh** the browser to see updates

## 🎯 Next Steps for Enhancement

### Easy Additions:
- Add more RSS sources
- Implement keyword filtering
- Add date range filtering
- Create simple categories (Malware, Breaches, etc.)

### Medium Difficulty:
- Add SQLite database for caching
- Implement basic sentiment analysis
- Create weekly digest feature
- Add RSS feed health monitoring

### Advanced Features:
- Threat intelligence scoring
- Integration with CVE databases
- Email alerting system
- Machine learning for threat classification

## 🐛 Troubleshooting

**Backend won't start?**
- Check Python version (3.7+ required)
- Ensure all dependencies installed
- Try running `python test_feeds.py` first

**No articles loading?**
- Check browser console for errors
- Verify backend is running on port 5000
- Test individual feeds with test script

**RSS feeds not working?**
- Some feeds may be temporarily unavailable
- Check internet connection
- Run test_feeds.py to identify issues

## 📋 Job Interview Talking Points

- **Risk Management**: "Built this to demonstrate proactive threat monitoring"
- **Technical Skills**: "Full-stack development with Python Flask and vanilla JavaScript"
- **Security Focus**: "Aggregates intelligence from trusted security sources"
- **Scalability**: "Designed for easy addition of new sources and features"