# ThreatStream

A cybersecurity news aggregator that pulls headlines from major security sources and displays them in one place. Built to help stay on top of current threats and vulnerabilities.

## What it does

Instead of checking multiple security news sites every day, this tool automatically grabs the latest headlines from:
- Krebs on Security
- The Hacker News  
- Dark Reading
- Security Week
- CISA Alerts

Then displays them in a clean dashboard where you can search, filter by source, and quickly scan for relevant threats.

## Why I built this

Staying current with cybersecurity news is crucial for risk management, but manually checking 5+ different sites daily is tedious. This automates the collection and makes it easy to spot emerging threats or important vulnerability announcements.

## Tech Stack

- **Backend**: Python + Flask for the API
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks needed)
- **Data**: RSS feed parsing with Python's feedparser library

## Project Structure

```
threatstream/
├── backend/           # Flask API that fetches RSS feeds
├── frontend/          # Web dashboard
├── setup scripts     # Easy installation
└── documentation
```

## Quick Start

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Start the backend:
   ```bash
   python app.py
   ```

3. Open `frontend/index.html` in your browser

The dashboard should load with the latest security news from all sources.

## Features

- Real-time news aggregation from multiple sources
- Search functionality to find specific topics
- Filter by news source
- Clean, responsive design that works on mobile
- Automatic refresh every 30 minutes
- Error handling for when RSS feeds are down

## Future Ideas

- Add keyword alerts for specific threat types
- Category tagging (malware, breaches, vulnerabilities)
- Email digest feature
- Integration with CVE database
- Simple threat severity scoring

## Contributing

Feel free to submit issues or pull requests. This is a learning project focused on practical cybersecurity tools.

## License

MIT License