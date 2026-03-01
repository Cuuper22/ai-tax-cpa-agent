"""
Conversation History Storage
Persistent storage for agent conversations using file-based system
"""
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
import hashlib


class ConversationStore:
    """File-based conversation history storage"""

    def __init__(self, storage_dir: str = ".conversation_history"):
        """
        Initialize conversation store

        Args:
            storage_dir: Directory to store conversation files
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)

    def _get_conversation_file(self, session_id: str) -> Path:
        """Get file path for a conversation session"""
        # Sanitize session_id for filename
        safe_id = hashlib.md5(session_id.encode()).hexdigest()
        return self.storage_dir / f"conversation_{safe_id}.json"

    def save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Save a message to conversation history

        Args:
            session_id: Unique session identifier
            role: Message role (user, assistant, system)
            content: Message content
            metadata: Optional metadata dict
        """
        file_path = self._get_conversation_file(session_id)

        # Load existing conversation
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                conversation = json.load(f)
        else:
            conversation = {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
                "messages": []
            }

        # Add new message
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        conversation["messages"].append(message)
        conversation["updated_at"] = datetime.utcnow().isoformat()

        # Save back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(conversation, f, indent=2, ensure_ascii=False)

    def get_conversation(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve conversation history

        Args:
            session_id: Unique session identifier

        Returns:
            Conversation dict or None if not found
        """
        file_path = self._get_conversation_file(session_id)

        if not file_path.exists():
            return None

        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Get message list for a session

        Args:
            session_id: Unique session identifier

        Returns:
            List of messages (empty list if session not found)
        """
        conversation = self.get_conversation(session_id)
        if conversation:
            return conversation.get("messages", [])
        return []

    def clear_conversation(self, session_id: str) -> bool:
        """
        Clear conversation history for a session

        Args:
            session_id: Unique session identifier

        Returns:
            True if deleted, False if not found
        """
        file_path = self._get_conversation_file(session_id)

        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def list_sessions(self) -> List[Dict[str, str]]:
        """
        List all conversation sessions

        Returns:
            List of session metadata dicts
        """
        sessions = []

        for file_path in self.storage_dir.glob("conversation_*.json"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    sessions.append({
                        "session_id": data.get("session_id", "unknown"),
                        "created_at": data.get("created_at", "unknown"),
                        "updated_at": data.get("updated_at", "unknown"),
                        "message_count": len(data.get("messages", []))
                    })
            except (json.JSONDecodeError, IOError):
                continue

        # Sort by updated_at descending
        sessions.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return sessions
