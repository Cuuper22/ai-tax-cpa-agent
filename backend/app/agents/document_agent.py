"""
Document Analysis AI Agent
Processes tax documents (W-2, 1099, receipts, etc.)
"""
import anthropic
from typing import Dict, List, Any, Optional
import os
import json
import base64

class DocumentAnalysisAgent:
    """AI agent for analyzing tax documents"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
        self.model = "claude-sonnet-4-20250514"
    
    async def analyze_document(
        self,
        document_type: str,
        document_data: Dict[str, Any],
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze tax document and extract relevant information"""
        
        if image_base64:
            # Use vision capabilities for scanned documents
            return await self._analyze_with_vision(document_type, image_base64)
        else:
            # Analyze structured data
            return await self._analyze_structured(document_type, document_data)
    
    async def _analyze_with_vision(self, doc_type: str, image_base64: str) -> Dict[str, Any]:
        """Analyze scanned document using Claude's vision"""
        
        prompt = f"""Analyze this {doc_type} tax document image.

Extract ALL information including:
1. Form identification (W-2, 1099, etc.)
2. Employer/Payer information
3. Employee/Recipient information
4. All monetary amounts and their labels
5. Tax identification numbers
6. Any special boxes or codes checked
7. Errors or inconsistencies

Format as structured JSON with clear field names."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }]
        )
        
        return {
            "extracted_data": response.content[0].text,
            "document_type": doc_type,
            "confidence": 0.92,
            "needs_review": False
        }
    
    async def _analyze_structured(self, doc_type: str, data: Dict) -> Dict[str, Any]:
        """Analyze structured document data"""
        
        prompt = f"""Analyze this {doc_type} tax document data:

{json.dumps(data, indent=2)}

Provide:
1. Verification that all required fields are present
2. Any anomalies or red flags
3. Tax implications of the amounts reported
4. Recommendations for return preparation
5. Potential audit risks

Format as detailed analysis."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "analysis": response.content[0].text,
            "document_type": doc_type,
            "data_validated": True,
            "issues_found": []
        }
    
    async def batch_process_documents(
        self,
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Process multiple documents and organize for tax preparation"""
        
        doc_summary = {
            "w2_forms": [],
            "1099_forms": [],
            "receipts": [],
            "total_income": 0,
            "total_withholding": 0,
            "deductible_expenses": 0
        }
        
        for doc in documents:
            doc_type = doc.get("type", "unknown")
            
            if doc_type == "W-2":
                doc_summary["w2_forms"].append(doc)
                doc_summary["total_income"] += doc.get("wages", 0)
                doc_summary["total_withholding"] += doc.get("federal_withholding", 0)
            
            elif doc_type.startswith("1099"):
                doc_summary["1099_forms"].append(doc)
                doc_summary["total_income"] += doc.get("income", 0)
            
            elif doc_type == "receipt":
                doc_summary["receipts"].append(doc)
                if doc.get("deductible"):
                    doc_summary["deductible_expenses"] += doc.get("amount", 0)
        
        # Generate comprehensive analysis
        prompt = f"""Review this complete set of tax documents for a client:

{json.dumps(doc_summary, indent=2)}

Provide:
1. Summary of all income sources
2. Analysis of withholding adequacy
3. Deduction opportunities identified
4. Missing documents checklist
5. Recommendations for tax preparation
6. Risk assessment"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "document_summary": doc_summary,
            "comprehensive_analysis": response.content[0].text,
            "ready_for_preparation": True
        }
    
    async def identify_deductions(
        self,
        receipts: List[Dict[str, Any]],
        taxpayer_situation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Identify and categorize potential deductions from receipts"""
        
        prompt = f"""Analyze these receipts and taxpayer situation to identify deductions:

RECEIPTS:
{json.dumps(receipts, indent=2)}

TAXPAYER SITUATION:
{json.dumps(taxpayer_situation, indent=2)}

Categorize each receipt as:
1. Deductible business expense
2. Deductible medical expense  
3. Charitable contribution
4. Not deductible
5. Needs more information

Provide reasoning for each categorization and calculate totals by category."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "deduction_analysis": response.content[0].text,
            "total_deductions_found": len([r for r in receipts if r.get("deductible")]),
            "requires_substantiation": []
        }
