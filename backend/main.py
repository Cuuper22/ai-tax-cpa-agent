from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import os

app = FastAPI(title="AI Tax CPA Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaxReturnRequest(BaseModel):
    entity_type: str
    gross_income: float
    filing_status: str = "single"

@app.get("/")
async def root():
    return {"status": "online", "service": "AI Tax CPA Agent"}

@app.post("/api/tax/calculate")
async def calculate_tax(request: TaxReturnRequest):
    return {"success": True, "tax": request.gross_income * 0.22}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
