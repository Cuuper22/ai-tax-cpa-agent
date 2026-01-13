# Deployment Guide - AI Tax CPA Agent

## Quick Start

### Prerequisites
- Python 3.10+ (for backend)
- Node.js 18+ (for frontend)
- API Keys:
  - Anthropic Claude API key
  - (Optional) ElevenLabs for voice
  - (Optional) D-ID for avatars

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create .env file:
```bash
cp .env.example .env
```

5. Add your API keys to .env:
```
ANTHROPIC_API_KEY=your_key_here
```

6. Run backend:
```bash
python main.py
```

Backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Frontend will be available at http://localhost:3000

## Testing the System

### 1. Tax Calculation Test
- Navigate to http://localhost:3000/tax-prep
- Enter income: $75,000
- Click "Calculate Tax"
- Verify AI calculates tax correctly

### 2. Voice Call Test
- Navigate to http://localhost:3000/voice-call
- Click "Start Call"
- Type messages as the IRS agent
- Watch AI CPA respond professionally

### 3. Benchmarking Your Friend
- Have your friend prepare a tax return manually
- Use the AI to prepare the same return
- Compare:
  - Time taken
  - Accuracy
  - Optimizations found
  - Cost savings identified

## Production Deployment

### Docker Deployment (Recommended)

Create docker-compose.yml:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

Run:
```bash
docker-compose up -d
```

## Features to Demonstrate

1. **Complex Tax Returns**
   - Multi-state returns
   - Business entities (S-Corp, Partnership)
   - International tax compliance

2. **IRS Audit Defense**
   - Audit notice analysis
   - Response letter generation
   - Legal research with citations

3. **Voice Interaction**
   - Natural conversation
   - Professional representation
   - Handles difficult questions

4. **Speed Comparison**
   - AI: Seconds to minutes
   - Human CPA: Hours to days

## API Endpoints

### Tax Preparation
- POST /api/tax/calculate - Calculate taxes
- POST /api/tax/prepare - Prepare full return
- POST /api/tax/review - Review return

### Audit Defense
- POST /api/audit/analyze - Analyze audit notice
- POST /api/audit/response - Generate response
- POST /api/audit/research - Research tax law

### Voice Communication
- POST /api/voice/respond - Handle conversation
- POST /api/voice/simulate-irs - Simulate IRS agent
- WS /ws/voice-call - Real-time voice call

## Troubleshooting

### Backend won't start
- Check Python version: `python --version`
- Verify API key in .env
- Check port 8000 is available

### Frontend won't start
- Check Node version: `node --version`
- Run `npm install` again
- Check port 3000 is available

### AI not responding
- Verify ANTHROPIC_API_KEY is correct
- Check backend logs
- Ensure backend is running

## Performance Metrics

Expected performance:
- Tax calculation: < 2 seconds
- Full return preparation: 30-60 seconds
- Audit analysis: 20-40 seconds
- Voice response: 1-3 seconds

## Support

For issues or questions:
- Check GitHub Issues
- Review API documentation
- Verify all dependencies installed
