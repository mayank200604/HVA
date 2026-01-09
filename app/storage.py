# storage.py
import sqlite3
from datetime import datetime
import os

# -----------------------------
# Database path
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chat.db")
print("USING DB:", DB_PATH)


# -----------------------------
# Connection helper
# -----------------------------
def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


# -----------------------------
# Initialize DB
# -----------------------------
def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # Conversations table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        created_at TEXT NOT NULL
    )
    """)
    
    # Add user_id column if it doesn't exist (migration for existing databases)
    try:
        cur.execute("ALTER TABLE conversations ADD COLUMN user_id TEXT")
        print("✅ Added user_id column to conversations table")
    except sqlite3.OperationalError:
        # Column already exists
        pass

    # Messages table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        model TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id)
            REFERENCES conversations(id)
            ON DELETE CASCADE
    )
    """)

    # Helpful index for performance
    cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
    ON messages(conversation_id)
    """)

    # -----------------------------
    # Migration / Backfill
    # -----------------------------
    cur.execute("""
    INSERT OR IGNORE INTO conversations (id, created_at)
    SELECT
        conversation_id,
        MIN(created_at)
    FROM messages
    WHERE conversation_id IS NOT NULL
    GROUP BY conversation_id
    """)

    conn.commit()
    conn.close()


# -----------------------------
# Conversation helpers
# -----------------------------
def create_conversation(conversation_id: str, user_id: str = None):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT OR IGNORE INTO conversations (id, user_id, created_at)
        VALUES (?, ?, ?)
        """,
        (conversation_id, user_id, datetime.utcnow().isoformat())
    )

    conn.commit()
    conn.close()


def get_all_conversations(user_id: str = None, limit=100, offset=0):
    conn = get_conn()
    cur = conn.cursor()

    if user_id:
        # When user_id is provided, ONLY return conversations for that specific user
        # Do NOT return conversations with NULL user_id
        cur.execute(
            """
            SELECT id, created_at
            FROM conversations
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (user_id, limit, offset)
        )
    else:
        # Only when NO user_id is provided (admin/debug use), return all conversations
        # This should NOT be called from the frontend
        cur.execute(
            """
            SELECT id, created_at
            FROM conversations
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset)
        )

    rows = cur.fetchall()
    conn.close()

    return [
        {"id": row["id"], "created_at": row["created_at"]}
        for row in rows
    ]


def delete_conversation(conversation_id: str, user_id: str = None):
    conn = get_conn()
    cur = conn.cursor()

    # Messages will be deleted automatically due to CASCADE
    # Only delete if user_id matches (security check)
    if user_id:
        cur.execute(
            "DELETE FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, user_id)
        )
    else:
        # Fallback for backward compatibility
        cur.execute(
            "DELETE FROM conversations WHERE id = ?",
            (conversation_id,)
        )

    conn.commit()
    conn.close()


# -----------------------------
# Message helpers
# -----------------------------
def save_message(conversation_id, role, content, model=None):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO messages
        (conversation_id, role, content, model, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            conversation_id,
            role,
            content,
            model,
            datetime.utcnow().isoformat()
        )
    )

    conn.commit()
    conn.close()


def load_recent_messages(conversation_id, limit=12):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT role, content
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (conversation_id, limit)
    )

    rows = cur.fetchall()
    conn.close()

    # Reverse so oldest → newest
    return [(row["role"], row["content"]) for row in reversed(rows)]


def get_conversation_messages(conversation_id):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT role, content, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
        """,
        (conversation_id,)
    )

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "role": row["role"],
            "content": row["content"],
            "created_at": row["created_at"]
        }
        for row in rows
    ]
