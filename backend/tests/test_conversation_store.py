"""Tests for the conversation store."""
import pytest
import tempfile
import shutil
from pathlib import Path

from app.utils.conversation_store import ConversationStore


@pytest.fixture
def store(tmp_path):
    """Create a conversation store with a temp directory."""
    return ConversationStore(storage_dir=str(tmp_path / "conversations"))


def test_save_and_retrieve_message(store):
    store.save_message("session-1", "user", "Hello")
    messages = store.get_messages("session-1")
    assert len(messages) == 1
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Hello"


def test_multiple_messages(store):
    store.save_message("session-1", "user", "Hi")
    store.save_message("session-1", "assistant", "Hello! How can I help?")
    store.save_message("session-1", "user", "Tax question")
    messages = store.get_messages("session-1")
    assert len(messages) == 3


def test_session_isolation(store):
    store.save_message("session-a", "user", "Message A")
    store.save_message("session-b", "user", "Message B")
    assert len(store.get_messages("session-a")) == 1
    assert len(store.get_messages("session-b")) == 1
    assert store.get_messages("session-a")[0]["content"] == "Message A"


def test_nonexistent_session(store):
    assert store.get_messages("ghost") == []
    assert store.get_conversation("ghost") is None


def test_clear_conversation(store):
    store.save_message("session-1", "user", "temp")
    assert store.clear_conversation("session-1") is True
    assert store.get_messages("session-1") == []


def test_clear_nonexistent(store):
    assert store.clear_conversation("ghost") is False


def test_list_sessions(store):
    store.save_message("s1", "user", "a")
    store.save_message("s2", "user", "b")
    sessions = store.list_sessions()
    assert len(sessions) == 2
    session_ids = {s["session_id"] for s in sessions}
    assert "s1" in session_ids
    assert "s2" in session_ids


def test_metadata_saved(store):
    store.save_message("s1", "user", "hello", metadata={"source": "api"})
    messages = store.get_messages("s1")
    assert messages[0]["metadata"]["source"] == "api"
