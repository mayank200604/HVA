# firestore_storage.py
"""
Firestore-based storage implementation for conversations and messages.
This can be used as an alternative to SQLite storage.
"""

from datetime import datetime
from typing import List, Dict, Optional
from firebase_admin import firestore
from firebase import db

# Collection names
CONVERSATIONS_COLLECTION = "conversations"
MESSAGES_COLLECTION = "messages"


# -----------------------------
# Conversation helpers
# -----------------------------

def create_conversation(conversation_id: str) -> None:
    """Create a new conversation in Firestore"""
    try:
        conversation_ref = db.collection(CONVERSATIONS_COLLECTION).document(conversation_id)
        conversation_ref.set({
            'id': conversation_id,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        print(f"✅ Created conversation: {conversation_id}")
    except Exception as e:
        print(f"❌ Error creating conversation {conversation_id}: {e}")
        raise


def get_all_conversations(limit: int = 100, offset: int = 0) -> List[Dict]:
    """Get all conversations, ordered by creation date (newest first)"""
    try:
        conversations_ref = db.collection(CONVERSATIONS_COLLECTION)
        query = conversations_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        docs = query.stream()
        
        conversations = []
        for doc in docs:
            data = doc.to_dict()
            conversations.append({
                'id': data.get('id', doc.id),
                'created_at': data.get('created_at').isoformat() if data.get('created_at') else None
            })
        
        return conversations
    except Exception as e:
        print(f"❌ Error getting conversations: {e}")
        return []


def delete_conversation(conversation_id: str) -> None:
    """Delete a conversation and all its messages"""
    try:
        # Delete the conversation document
        conversation_ref = db.collection(CONVERSATIONS_COLLECTION).document(conversation_id)
        conversation_ref.delete()
        
        # Delete all messages in this conversation
        messages_ref = db.collection(MESSAGES_COLLECTION).where('conversation_id', '==', conversation_id)
        messages = messages_ref.stream()
        
        batch = db.batch()
        for msg in messages:
            batch.delete(msg.reference)
        batch.commit()
        
        print(f"✅ Deleted conversation: {conversation_id}")
    except Exception as e:
        print(f"❌ Error deleting conversation {conversation_id}: {e}")
        raise


# -----------------------------
# Message helpers
# -----------------------------

def save_message(conversation_id: str, role: str, content: str, model: Optional[str] = None) -> None:
    """Save a message to Firestore"""
    try:
        # Ensure conversation exists
        conversation_ref = db.collection(CONVERSATIONS_COLLECTION).document(conversation_id)
        conversation_doc = conversation_ref.get()
        
        if not conversation_doc.exists:
            create_conversation(conversation_id)
        else:
            # Update conversation's updated_at timestamp
            conversation_ref.update({'updated_at': firestore.SERVER_TIMESTAMP})
        
        # Add the message
        message_data = {
            'conversation_id': conversation_id,
            'role': role,
            'content': content,
            'model': model,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        db.collection(MESSAGES_COLLECTION).add(message_data)
        print(f"✅ Saved message for conversation: {conversation_id}")
    except Exception as e:
        print(f"❌ Error saving message: {e}")
        raise


def load_recent_messages(conversation_id: str, limit: int = 12) -> List[tuple]:
    """Load recent messages for a conversation (oldest to newest)"""
    try:
        messages_ref = db.collection(MESSAGES_COLLECTION)
        query = messages_ref.where('conversation_id', '==', conversation_id)
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
        query = query.limit(limit)
        
        docs = query.stream()
        
        messages = []
        for doc in docs:
            data = doc.to_dict()
            messages.append((data.get('role'), data.get('content')))
        
        # Reverse to get oldest → newest
        return list(reversed(messages))
    except Exception as e:
        print(f"❌ Error loading recent messages: {e}")
        return []


def get_conversation_messages(conversation_id: str) -> List[Dict]:
    """Get all messages for a conversation (oldest to newest)"""
    try:
        messages_ref = db.collection(MESSAGES_COLLECTION)
        query = messages_ref.where('conversation_id', '==', conversation_id)
        query = query.order_by('created_at', direction=firestore.Query.ASCENDING)
        
        docs = query.stream()
        
        messages = []
        for doc in docs:
            data = doc.to_dict()
            created_at = data.get('created_at')
            messages.append({
                'role': data.get('role'),
                'content': data.get('content'),
                'created_at': created_at.isoformat() if created_at else None
            })
        
        return messages
    except Exception as e:
        print(f"❌ Error getting conversation messages: {e}")
        return []


# -----------------------------
# Utility functions
# -----------------------------

def get_conversation_count() -> int:
    """Get total number of conversations"""
    try:
        conversations_ref = db.collection(CONVERSATIONS_COLLECTION)
        docs = conversations_ref.stream()
        return len(list(docs))
    except Exception as e:
        print(f"❌ Error getting conversation count: {e}")
        return 0


def get_message_count(conversation_id: Optional[str] = None) -> int:
    """Get total number of messages, optionally filtered by conversation"""
    try:
        messages_ref = db.collection(MESSAGES_COLLECTION)
        
        if conversation_id:
            messages_ref = messages_ref.where('conversation_id', '==', conversation_id)
        
        docs = messages_ref.stream()
        return len(list(docs))
    except Exception as e:
        print(f"❌ Error getting message count: {e}")
        return 0
