# AI Summary Setup Guide

## 🚀 Quick Setup Instructions

### 1. **Get Claude API Key**
- Visit: https://console.anthropic.com/
- Sign up/login to Anthropic
- Go to "API Keys" section
- Create a new API key
- Copy the key (starts with `sk-ant-`)

### 2. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

### 3. **Configure Environment**
Create a `.env` file in the `backend` folder:
```bash
# Copy this content to backend/.env
ANTHROPIC_API_KEY=your-api-key-here
```

**OR** set as environment variable:
```bash
# Windows (Command Prompt)
set ANTHROPIC_API_KEY=your-api-key-here

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="your-api-key-here"

# macOS/Linux
export ANTHROPIC_API_KEY="your-api-key-here"
```

### 4. **Start the Backend**
```bash
cd backend
python app.py
```

You should see:
```
🚀 Starting ThreatStream Backend...
✅ Claude API client initialized successfully
🌐 API Endpoints:
   - GET  /api/test           - Health check
   - POST /api/summarize      - Generate AI summary
```

### 5. **Test the Integration**
- Open your ThreatStream dashboard
- Click any "🤖 AI Summary" button on threat cards
- First summary takes ~3-5 seconds, cached summaries are instant

## 📊 Features

### **Intelligent Caching**
- Summaries cached for 24 hours
- Automatic cache cleanup
- No duplicate API calls for same articles

### **SOC-Focused Analysis**
- Threat overview and attack vectors
- Affected systems and risk assessment  
- Actionable remediation steps
- IOCs and detection rules

### **Error Handling**
- Graceful fallbacks when API unavailable
- Retry buttons for failed requests
- Clear error messages

## 🔧 API Usage

### **Generate Summary**
```bash
curl -X POST http://localhost:5000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CVE-2025-0147",
    "title": "Critical Zero-Day Vulnerability",
    "summary": "RCE vulnerability in Apache Struts...",
    "source": "NIST NVD",
    "severity": "critical",
    "cvss": 9.8,
    "threats": ["RCE", "Zero-Day"]
  }'
```

### **Check Cache Stats**
```bash
curl http://localhost:5000/api/cache/stats
```

### **Health Check**
```bash
curl http://localhost:5000/api/test
```

## 💰 Cost Considerations

Using **Claude 3 Haiku** (most cost-effective):
- ~$0.00025 per summary (typically 1500 tokens)
- 24-hour caching minimizes API calls
- Average cost: $0.01-0.05 per day for typical usage

## 🔒 Security Notes

- API key stored locally only
- No data sent to external services beyond Anthropic
- All communications over HTTPS
- Cache stored in memory (not persisted)

## 🐛 Troubleshooting

### **"Claude API not configured"**
- Check if `ANTHROPIC_API_KEY` is set correctly
- Verify API key format (starts with `sk-ant-`)
- Test with: `python -c "import os; print(os.getenv('ANTHROPIC_API_KEY'))"`

### **"Summary Unavailable"**
- Check backend is running (`http://localhost:5000/api/test`)
- Verify internet connection
- Check API key credits at https://console.anthropic.com/

### **CORS Errors**
- Ensure backend started successfully
- Check browser console for specific errors
- Verify frontend connecting to correct port (5000)

## 📈 Next Steps

Once individual summaries work, we'll add:
- Daily threat landscape overview
- Trending threat analysis
- Custom summary templates
- Summary export functionality
