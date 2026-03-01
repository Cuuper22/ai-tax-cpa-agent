"""
AI Tax CPA Agent - Production API
FastAPI backend with real tax calculations and proper security
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Any, Optional
from decimal import Decimal
import os
import time
import logging
from collections import defaultdict
from datetime import datetime, timedelta

from app.tax_engine.tax_calculator import TaxCalculator, FilingStatus
from app.agents.tax_prep_agent import TaxPreparationAgent
from app.agents.audit_agent import AuditDefenseAgent
from app.agents.document_agent import DocumentAnalysisAgent
from app.agents.voice_agent import VoiceAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle"""
    logger.info("=" * 60)
    logger.info("AI Tax CPA Agent API - Starting")
    logger.info("=" * 60)
    logger.info(f"ANTHROPIC_API_KEY configured: {bool(os.getenv('ANTHROPIC_API_KEY'))}")
    logger.info(f"Environment: {os.getenv('APP_ENV', 'development')}")
    logger.info("=" * 60)
    yield


# Initialize FastAPI app
app = FastAPI(
    title="AI Tax CPA Agent",
    version="1.0.0",
    description="Production-ready AI tax preparation and CPA services (Demo/Educational)",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# RATE LIMITING
# ============================================================================

class RateLimiter:
    """Simple in-memory rate limiter"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed for client"""
        now = time.time()
        minute_ago = now - 60

        # Clean old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > minute_ago
        ]

        # Check rate limit
        if len(self.requests[client_id]) >= self.requests_per_minute:
            return False

        # Add current request
        self.requests[client_id].append(now)
        return True


rate_limiter = RateLimiter(requests_per_minute=60)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to all requests"""
    client_ip = request.client.host

    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later."
            }
        )

    response = await call_next(request)
    return response


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TaxReturnRequest(BaseModel):
    """Request model for tax calculation"""
    entity_type: str = Field(..., description="Type of entity (1040, 1120, etc.)")
    gross_income: float = Field(..., gt=0, description="Gross income (must be positive)")
    filing_status: str = Field(
        default="single",
        description="Filing status: single, married_joint, married_separate, head_of_household"
    )
    itemized_deductions: Optional[float] = Field(
        None, ge=0, description="Itemized deductions if applicable"
    )
    dependents: int = Field(default=0, ge=0, description="Number of dependents")

    @field_validator("gross_income")
    @classmethod
    def validate_gross_income(cls, v):
        if v < 0:
            raise ValueError("Gross income cannot be negative")
        if v > 1_000_000_000:  # Sanity check
            raise ValueError("Gross income exceeds reasonable limit")
        return v

    @field_validator("filing_status")
    @classmethod
    def validate_filing_status(cls, v):
        valid_statuses = ["single", "married_joint", "married_separate", "head_of_household"]
        if v.lower() not in valid_statuses:
            raise ValueError(f"Filing status must be one of: {', '.join(valid_statuses)}")
        return v.lower()


class DocumentAnalysisRequest(BaseModel):
    """Request model for document analysis"""
    document_type: str = Field(..., description="Type of document (W-2, 1099, receipt, etc.)")
    document_data: Dict[str, Any] = Field(..., description="Document data as JSON")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image (optional)")


class AuditDefenseRequest(BaseModel):
    """Request model for audit defense"""
    notice_text: str = Field(..., min_length=10, description="IRS audit notice text")
    client_documents: Dict[str, Any] = Field(default_factory=dict, description="Available client documents")


class QuarterlyEstimateRequest(BaseModel):
    """Request model for quarterly tax estimate"""
    estimated_annual_income: float = Field(..., gt=0, description="Estimated annual income")
    filing_status: str = Field(..., description="Filing status")
    withholding_to_date: float = Field(default=0, ge=0, description="Tax already withheld")


class VoiceChatRequest(BaseModel):
    """Request model for voice agent text chat"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message text")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    context: Dict[str, Any] = Field(default_factory=dict, description="Conversation context")


# ============================================================================
# HEALTH CHECK & INFO
# ============================================================================

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "online",
        "service": "AI Tax CPA Agent",
        "version": "1.0.0",
        "disclaimer": TaxCalculator.LEGAL_DISCLAIMER.strip(),
        "endpoints": {
            "tax_calculation": "/api/tax/calculate",
            "document_analysis": "/api/documents/analyze",
            "audit_defense": "/api/audit/analyze",
            "voice_agent": "/api/voice/chat (not implemented)",
        }
    }


@app.get("/api/disclaimer")
async def get_disclaimer():
    """Get legal disclaimer"""
    return {
        "disclaimer": TaxCalculator.LEGAL_DISCLAIMER.strip()
    }


# ============================================================================
# TAX CALCULATION ENDPOINTS
# ============================================================================

@app.post("/api/tax/calculate")
async def calculate_tax(request: TaxReturnRequest):
    """
    Calculate federal income tax using real IRS 2024 tax brackets

    Returns tax liability with detailed breakdown and legal disclaimer.
    """
    try:
        calculator = TaxCalculator(tax_year=2024)

        if request.entity_type == "1040":
            # Individual tax return
            result = calculator.calculate_individual_tax(
                gross_income=Decimal(str(request.gross_income)),
                filing_status=request.filing_status,
                itemized_deductions=Decimal(str(request.itemized_deductions)) if request.itemized_deductions else None,
                dependents=request.dependents,
            )
        elif request.entity_type == "1120":
            # Corporate tax return
            result = calculator.calculate_corporate_tax(
                net_income=Decimal(str(request.gross_income)),
                entity_type="C-Corp",
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported entity type: {request.entity_type}. Use 1040 or 1120."
            )

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error in tax calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Sanitize error message to avoid leaking sensitive info
        logger.error(f"Error in tax calculation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during tax calculation. Please check your input and try again."
        )


@app.post("/api/tax/quarterly")
async def estimate_quarterly(request: QuarterlyEstimateRequest):
    """Estimate quarterly tax payments"""
    try:
        calculator = TaxCalculator(tax_year=2024)

        result = calculator.estimate_quarterly_payments(
            estimated_annual_income=Decimal(str(request.estimated_annual_income)),
            filing_status=request.filing_status,
            withholding_to_date=Decimal(str(request.withholding_to_date)),
        )

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in quarterly estimation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred. Please try again.")


# ============================================================================
# DOCUMENT ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/api/documents/analyze")
async def analyze_document(request: DocumentAnalysisRequest):
    """
    Analyze tax documents (W-2, 1099, receipts) using AI

    Extracts structured data and provides tax implications.
    """
    try:
        # Check for API key
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="AI service not configured. Please set ANTHROPIC_API_KEY environment variable."
            )

        agent = DocumentAnalysisAgent()

        result = await agent.analyze_document(
            document_type=request.document_type,
            document_data=request.document_data,
            image_base64=request.image_base64,
        )

        return {
            "success": True,
            "data": result,
            "disclaimer": TaxCalculator.LEGAL_DISCLAIMER.strip(),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in document analysis: {str(e)}")
        # Sanitize error - don't leak API keys or sensitive data
        raise HTTPException(
            status_code=500,
            detail="An error occurred during document analysis. Please try again."
        )


# ============================================================================
# AUDIT DEFENSE ENDPOINTS
# ============================================================================

@app.post("/api/audit/analyze")
async def analyze_audit(request: AuditDefenseRequest):
    """
    Analyze IRS audit notice and generate defense strategy

    Provides professional analysis and response recommendations.
    """
    try:
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="AI service not configured. Please set ANTHROPIC_API_KEY environment variable."
            )

        agent = AuditDefenseAgent()

        result = await agent.analyze_audit_notice(
            notice_text=request.notice_text,
            client_documents=request.client_documents,
        )

        return {
            "success": True,
            "data": result,
            "disclaimer": TaxCalculator.LEGAL_DISCLAIMER.strip(),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in audit analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during audit analysis. Please try again."
        )


# ============================================================================
# VOICE AGENT ENDPOINTS (Text-based chat implemented, audio not implemented)
# ============================================================================

@app.post("/api/voice/chat")
async def voice_chat(request: VoiceChatRequest):
    """
    Voice agent text chat — AI CPA conversation via text

    Supports persistent conversation history per session.
    Audio/speech features require external STT/TTS services (not implemented).
    """
    try:
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="AI service not configured. Please set ANTHROPIC_API_KEY environment variable."
            )

        agent = VoiceAgent(session_id=request.session_id)

        result = await agent.handle_live_conversation(
            user_message=request.message,
            context=request.context,
        )

        return {
            "success": True,
            "data": result,
            "session_id": agent.session_id,
            "disclaimer": TaxCalculator.LEGAL_DISCLAIMER.strip(),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in voice chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred during the conversation. Please try again."
        )


@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    """
    Voice WebSocket endpoint — NOT IMPLEMENTED (requires STT/TTS services)

    Real-time audio streaming requires OpenAI Whisper + ElevenLabs integration.
    Use /api/voice/chat for text-based CPA conversations instead.
    """
    await websocket.accept()
    await websocket.send_json({
        "error": "Not Implemented",
        "message": "Audio WebSocket requires STT/TTS services. Use /api/voice/chat for text-based conversations."
    })
    await websocket.close()


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global error handler - sanitizes errors to prevent info leakage"""
    logger.error(f"Unhandled exception: {str(exc)}")

    # Don't leak internal details in production
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        log_level="info"
    )
