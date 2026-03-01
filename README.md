# AI Tax Accountant & CPA Agent

**⚠️ DISCLAIMER: This is a demo application for educational purposes only. It does not constitute real tax, legal, or financial advice. Consult a qualified CPA or tax professional for actual tax preparation and advice.**

Comprehensive AI system demonstrating AI-powered tax services with production-grade calculations.

## Purpose

A demonstration of how AI can augment (not replace) professional tax services. This project showcases real tax calculations, document analysis, and audit defense strategies using Claude AI.

## Core Features

### 1. Tax Return Preparation ✅ PRODUCTION-READY
- **Real 2024 IRS tax brackets** - Accurate progressive tax calculations
- Form 1040 (Individual) with all filing statuses:
  - Single
  - Married Filing Jointly
  - Married Filing Separately
  - Head of Household
- Form 1120 (Corporate) - 21% flat rate
- Standard and itemized deductions
- Quarterly estimated tax payments
- **Speed: Milliseconds** vs hours of manual calculation
- Detailed bracket breakdown and calculation steps

### 2. IRS Audit Defense ✅ AI-POWERED
- Analyzes audit notices using Claude AI
- Generates professional response strategies
- Cites IRC sections and regulations
- Provides risk assessment and recommendations
- **Note**: Requires valid ANTHROPIC_API_KEY

### 3. Voice Communication ⚠️ NOT IMPLEMENTED
- Placeholder endpoint for future voice features
- Returns proper "501 Not Implemented" response
- Would require:
  - Speech-to-text integration (OpenAI Whisper, etc.)
  - Text-to-speech integration (ElevenLabs, etc.)
  - Real-time WebSocket connections

### 4. Document Analysis ✅ AI-POWERED
- W-2, 1099, receipt processing using Claude Vision
- Structured data extraction
- Tax implication analysis
- Batch document processing
- **Note**: Requires valid ANTHROPIC_API_KEY

### 5. Security & Production Features ✅
- Input validation on all endpoints
- Rate limiting (60 requests/minute per IP)
- Error sanitization (no API key leakage)
- Legal disclaimers on all responses
- Persistent conversation history (file-based)
- CORS protection
- Comprehensive logging

## What Actually Works

| Feature | Status | Notes |
|---------|--------|-------|
| Tax calculation (1040) | ✅ Production | Real 2024 IRS brackets |
| Tax calculation (1120) | ✅ Production | 21% corporate rate |
| Quarterly estimates | ✅ Production | Accurate payment schedule |
| Document analysis | ✅ AI-Powered | Requires API key |
| Audit defense | ✅ AI-Powered | Requires API key |
| Voice agent | ❌ Not implemented | Placeholder only |
| Voice WebSocket | ❌ Not implemented | Placeholder only |

## Installation

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

   Required for AI features:
   - `ANTHROPIC_API_KEY` - For document/audit analysis

3. **Run the server**:
   ```bash
   python main.py
   ```

   Server runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## API Endpoints

### Tax Calculation (No API key required)

**POST** `/api/tax/calculate`
```json
{
  "entity_type": "1040",
  "gross_income": 75000,
  "filing_status": "single",
  "itemized_deductions": 15000,
  "dependents": 2
}
```

**POST** `/api/tax/quarterly`
```json
{
  "estimated_annual_income": 100000,
  "filing_status": "married_joint",
  "withholding_to_date": 5000
}
```

### Document Analysis (Requires ANTHROPIC_API_KEY)

**POST** `/api/documents/analyze`
```json
{
  "document_type": "W-2",
  "document_data": {
    "employer": "ABC Corp",
    "wages": 75000,
    "federal_withholding": 12000
  }
}
```

### Audit Defense (Requires ANTHROPIC_API_KEY)

**POST** `/api/audit/analyze`
```json
{
  "notice_text": "IRS is questioning...",
  "client_documents": {}
}
```

### Voice Agent (Not Implemented)

**POST** `/api/voice/chat` - Returns 501 Not Implemented

**WebSocket** `/ws/voice` - Returns error message and closes

## Testing the Demo

### 1. Test Tax Calculations (No API key needed)

```bash
# Single filer with $75,000 income
curl -X POST http://localhost:8000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{"entity_type": "1040", "gross_income": 75000, "filing_status": "single"}'

# Married filing jointly with $150,000 income
curl -X POST http://localhost:8000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{"entity_type": "1040", "gross_income": 150000, "filing_status": "married_joint"}'

# Corporate tax (21% flat)
curl -X POST http://localhost:8000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{"entity_type": "1120", "gross_income": 500000, "filing_status": "single"}'
```

### 2. Test Document Analysis (Requires API key)

```bash
curl -X POST http://localhost:8000/api/documents/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "W-2",
    "document_data": {
      "employer": "Tech Corp",
      "wages": 95000,
      "federal_withholding": 18000
    }
  }'
```

### 3. Test Rate Limiting

```bash
# Send 70 requests rapidly - will get rate limited
for i in {1..70}; do
  curl http://localhost:8000/
done
```

## Tech Stack

- **Backend**: FastAPI (Python 3.10+)
- **AI**: Anthropic Claude Sonnet 4 (for document/audit analysis)
- **Tax Engine**: Custom implementation with real IRS 2024 brackets
- **Storage**: File-based conversation history
- **Frontend**: Next.js + TypeScript (separate project)
- **Security**: Rate limiting, input validation, error sanitization

## Development

### Run Tests (if implemented)
```bash
cd backend
pytest
```

### Code Quality
```bash
# Format code
black .

# Type checking
mypy .

# Linting
ruff check .
```

## Limitations & Future Work

### Current Limitations
- No state tax calculations (federal only)
- No multi-year tax planning
- No actual IRS e-filing integration
- Voice features not implemented
- File-based storage (not production-scale)

### Future Enhancements
- State tax support
- Tax optimization strategies
- Real e-filing integration
- Voice agent with speech synthesis
- SQLite/PostgreSQL storage
- Multi-user authentication
- Tax form PDF generation

## Legal & Compliance

**This software is provided for educational and demonstration purposes only.**

- Not certified by the IRS
- Not a substitute for professional tax advice
- No warranty or guarantee of accuracy
- Users assume all responsibility for tax decisions
- Consult a licensed CPA or tax professional for real tax matters

## Repository

https://github.com/Cuuper22/ai-tax-cpa-agent

## License

MIT License - Use at your own risk for educational purposes.

---

**Built to demonstrate AI capabilities in tax services - not to replace human expertise.**
