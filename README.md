# Doom Scroll Daily

A cybersecurity news aggregator that pulls headlines from major security sources into one dashboard. Because if the world's ending, you might as well stay informed.

Built to help you doom scroll through current threats and vulnerabilities with a bit more organization than refreshing 8 different websites.

## What it does

Instead of checking multiple security news sites throughout the day, this tool automatically grabs the latest headlines and puts them in one place. You can search, filter by source, and see everything organized by severity.

**Current Sources:**
- SANS Internet Storm Center
- Bleeping Computer  
- The Record by Recorded Future
- Security Affairs
- Threatpost
- Dark Reading
- Krebs on Security
- CISA Alerts

## Features

- Real-time RSS feed aggregation (refreshes every 30 minutes)
- Search across all articles
- Filter by news source or severity level
- Automatic severity classification based on keywords
- Timeline view showing threat activity
- Dark theme because obviously
- Works on mobile

## Tech Stack

- **Backend**: Python + Flask with custom RSS parser
- **Frontend**: Vanilla HTML/CSS/JavaScript 
- **No frameworks** - keeps it simple

Built with Python 3.13 compatibility since feedparser and other RSS libraries are broken on newer Python versions.

## Quick Start

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the backend**
   ```bash
   python app.py
   ```

3. **Open the frontend**
   - Open `frontend/index.html` in your browser
   - News should start loading automatically

The backend runs on localhost:5000 and serves the RSS data via API.

## Development

Test the RSS feeds:
```bash
cd backend
python test_feeds.py
```

Test Python 3.13 compatibility:
```bash
python test_python313.py
```

Main API endpoint is `GET /api/feeds` which returns all the current articles.

## Why "Doom Scroll Daily"?

Let's be honest - we're all doom scrolling through bad news anyway. This just makes it more efficient and focused on cybersecurity threats. Plus the name made me laugh.

## Project Structure

```
doom-scroll-daily/
├── backend/              # Flask API 
│   ├── app.py           # Main app
│   ├── requirements.txt # Dependencies
│   └── test_*.py        # Testing scripts
├── frontend/            # Web interface
│   ├── index.html       # Main page
│   ├── script.js        # Dashboard logic
│   └── styles.css       # Styling
└── README.md           # This file
```

## Notes

- RSS feeds are cached for 30 minutes to avoid hammering the sources
- The severity classification is pretty basic - just keyword matching
- Some feeds might be temporarily unavailable (that's the internet for you)
- Built this primarily as a learning project but it's actually useful

## Contributing

Feel free to submit issues or PRs if you find bugs or want to add features. The code is straightforward enough that most changes should be easy to implement.

## License

MIT - do whatever you want with it.
