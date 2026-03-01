## Why

Tax prep software either charges $200+ for basic calculations or gets the math wrong. I wanted to see how far you could get with an AI agent that uses actual IRS brackets (Decimal precision, not floating point) combined with Claude for document understanding and audit strategy. The tax engine is real; the AI layer is a demo of what's possible.

# AI Tax CPA Agent

FastAPI backend that does real federal tax calculations using 2024 IRS brackets, plus AI-powered document analysis and audit defense via Claude.

**This is not tax advice.** It's a demo of what AI can do in the tax prep space. Consult an actual CPA for your taxes.

## What Actually Works

| Feature | Status | Notes |
|---------|--------|-------|
| Individual tax (Form 1040) | Real | Progressive brackets, all 4 filing statuses, standard + itemized deductions |
| Corporate tax (Form 1120) | Real | 21% flat rate (TCJA) |
| Quarterly estimates | Real | Calculates remaining liability, splits into 4 payments |
| Document analysis (W-2, 1099) | AI | Needs `ANTHROPIC_API_KEY` — structured extraction via Claude |
| Audit defense | AI | Generates response strategies with IRC citations |
| Voice chat (text) | AI | Text-based CPA conversation with persistent history |
| Voice chat (audio) | Stub | WebSocket endpoint exists but no STT/TTS integration |

The tax engine uses `Decimal` throughout for precision — no floating-point rounding surprises.

## Quick Start

```bash
cd backend
pip install -r requirements.txt

# Optional: set API key for AI features
export ANTHROPIC_API_KEY=sk-...

python main.py
# → http://localhost:8000
```

## API

**Tax calculation** (no API key needed):
```bash
curl -X POST http://localhost:8000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{"entity_type": "1040", "gross_income": 75000, "filing_status": "single"}'
```

**Quarterly estimates:**
```bash
curl -X POST http://localhost:8000/api/tax/quarterly \
  -H "Content-Type: application/json" \
  -d '{"estimated_annual_income": 100000, "filing_status": "single", "withholding_to_date": 5000}'
```

**Document analysis** (needs API key):
```bash
curl -X POST http://localhost:8000/api/documents/analyze \
  -H "Content-Type: application/json" \
  -d '{"document_type": "W-2", "document_data": {"employer": "Tech Corp", "wages": 95000}}'
```

**Voice chat** (needs API key):
```bash
curl -X POST http://localhost:8000/api/voice/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a question about home office deductions"}'
```

All responses include a legal disclaimer. Rate limited at 60 req/min per IP.

## Tests

```bash
cd backend
pytest tests/ -v
# 42 tests — tax engine, API endpoints, conversation store
```

## Stack

- **Backend:** FastAPI + Uvicorn
- **Tax Engine:** Custom Python with real IRS 2024 brackets (`Decimal` precision)
- **AI:** Anthropic Claude (document analysis, audit defense, voice chat)
- **Storage:** File-based conversation history
- **Frontend:** Next.js + Tailwind (separate `frontend/` directory)

## What's Not Here

- No state taxes (federal only)
- No e-filing integration
- No real audio/speech processing
- No multi-year planning
- No authentication/multi-user

## License

MIT
