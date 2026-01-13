# Quick Reference Guide

## Start the Application

### Windows
```
start.bat
```

### Linux/Mac
```
./start.sh
```

### Manual Start
**Terminal 1 - Backend**:
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend**:
```bash
cd frontend  
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Demo Flow

1. **Homepage** → Overview of capabilities
2. **Tax Prep** → Enter $75,000, calculate instantly
3. **Audit Defense** → Paste audit notice, get strategy
4. **Voice Call** → Friend plays IRS, AI responds
5. **Benchmark** → Compare AI vs Human speed

## Key API Endpoints

```
POST /api/tax/calculate        - Tax calculation
POST /api/audit/analyze        - Audit analysis
POST /api/voice/respond        - Voice response
WS   /ws/voice-call           - Real-time call
```

## Required

- Python 3.10+
- Node.js 18+
- Anthropic API key

## Environment Variable

```bash
export ANTHROPIC_API_KEY=your_key_here
```

## Challenge Your Friend

1. Run AI benchmark (5 seconds)
2. Friend does same task (2-3 hours)
3. Compare results
4. Prove AI is faster

## Repository

https://github.com/Cuuper22/ai-tax-cpa-agent

## Support

- See DEMO_GUIDE.md for detailed demo
- See PROJECT_SUMMARY.md for overview
- See DEPLOYMENT.md for full setup
