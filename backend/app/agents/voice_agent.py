"""
Voice Communication Agent
Handles realistic voice conversations with IRS simulation
"""
import anthropic
from typing import Dict, List, Any, AsyncIterator
import os
import json
import asyncio

class VoiceAgent:
    """AI agent for voice communication with natural speech patterns"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
        self.model = "claude-sonnet-4-20250514"
        self.conversation_history = []
    
    async def generate_call_script(
        self,
        call_purpose: str,
        client_info: Dict,
        talking_points: List[str]
    ) -> Dict[str, Any]:
        """Generate natural conversation script for IRS call"""
        
        prompt = f"""You are a professional CPA making a call to the IRS on behalf of a client.

CALL PURPOSE: {call_purpose}
CLIENT INFO: {json.dumps(client_info)}
KEY POINTS TO ADDRESS: {talking_points}

Generate a natural, conversational script including:
1. Professional greeting and introduction
2. Clear explanation of purpose
3. Response to likely IRS questions
4. Natural speech patterns (um, uh, brief pauses)
5. Professional but personable tone
6. Handling of potential objections
7. Closing and next steps

Make it sound human, not robotic. Include realistic speech patterns."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "script": response.content[0].text,
            "estimated_duration": "5-10 minutes",
            "difficulty": "medium"
        }
    
    async def handle_live_conversation(
        self,
        user_message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle live conversation turn with natural responses"""
        
        # Add to conversation history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        system_prompt = f"""You are a professional CPA in a live phone conversation with the IRS.

CONTEXT:
- Client: {context.get('client_name', 'Client')}
- Issue: {context.get('issue', 'Tax matter')}
- Your goal: {context.get('goal', 'Resolve the issue')}

Respond naturally as a CPA would in a phone call:
- Use occasional filler words (um, uh, hmm, you know)
- Include natural pauses (indicate with ...)
- Be professional but conversational
- Reference documents professionally
- Ask clarifying questions when needed
- Show you're listening and processing

Keep responses concise (2-4 sentences) to allow for natural back-and-forth."""

        messages = [{"role": "system", "content": system_prompt}] + self.conversation_history
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            messages=messages
        )
        
        agent_response = response.content[0].text
        
        # Add agent response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": agent_response
        })
        
        return {
            "response_text": agent_response,
            "speech_markup": self._add_speech_markup(agent_response),
            "suggested_tts_voice": "professional_male",
            "emotion": "confident"
        }
    
    def _add_speech_markup(self, text: str) -> str:
        """Add speech synthesis markup for natural delivery"""
        # Add SSML-style markup for natural speech
        markup = text
        
        # Add pauses after certain phrases
        markup = markup.replace("um,", '<break time="300ms"/>um,<break time="200ms"/>')
        markup = markup.replace("uh,", '<break time="300ms"/>uh,<break time="200ms"/>')
        markup = markup.replace("...", '<break time="500ms"/>')
        
        return markup
    
    async def simulate_irs_agent(
        self,
        cpa_message: str,
        irs_agent_personality: str = "professional"
    ) -> Dict[str, Any]:
        """Simulate IRS agent responses for practice/demo"""
        
        personalities = {
            "professional": "formal, by-the-book IRS agent",
            "difficult": "skeptical, questioning IRS agent",
            "helpful": "cooperative, solution-oriented IRS agent"
        }
        
        prompt = f"""You are an IRS agent on a phone call with a CPA. Your personality: {personalities[irs_agent_personality]}.

CPA just said: "{cpa_message}"

Respond as the IRS agent would:
- Reference IRS procedures and requirements
- Ask for specific documentation
- Quote relevant tax code sections
- Use IRS terminology
- Be realistic about what IRS would actually say

Keep response concise (2-3 sentences) for natural conversation flow."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "irs_response": response.content[0].text,
            "agent_mood": irs_agent_personality,
            "escalation_level": "normal"
        }
    
    def reset_conversation(self):
        """Reset conversation history for new call"""
        self.conversation_history = []
