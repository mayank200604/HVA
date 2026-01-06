# storage.py
import sqlite3
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chat.db")
print("USING DB:", DB_PATH)

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT,
        role TEXT,
        content TEXT,
        model TEXT,
        created_at TEXT
    )
    """)

    # Data Migration: Backfill conversations table from existing messages
    # This ensures consistency if messages exist without conversation metadata
    cur.execute("""
    INSERT OR IGNORE INTO conversations (id, created_at)
    SELECT DISTINCT conversation_id, MIN(created_at)
    FROM messages
    WHERE conversation_id IS NOT NULL
    GROUP BY conversation_id
    """)

    conn.commit()
    conn.close()

def create_conversation(conversation_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT OR IGNORE INTO conversations (id, created_at) VALUES (?, ?)",
        (conversation_id, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def save_message(conversation_id, role, content, model=None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT OR IGNORE INTO messages
           (conversation_id, role, content, model, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (conversation_id, role, content, model, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def load_recent_messages(conversation_id, limit=12):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """SELECT role, content FROM messages
           WHERE conversation_id = ?
           ORDER BY id DESC
           LIMIT ?""",
        (conversation_id, limit)
    )
    rows = cur.fetchall()
    conn.close()
    return list(reversed(rows))


def get_all_conversations(limit=100, offset=0):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, created_at FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (limit, offset)
    )
    rows = cur.fetchall()
    conn.close()
    return [{"id": r[0], "created_at": r[1]} for r in rows]


def get_conversation_messages(conversation_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT role, content, created_at FROM messages WHERE conversation_id=? ORDER BY id",
        (conversation_id,)
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {"role": r[0], "content": r[1], "created_at": r[2]}
        for r in rows
    ]

def delete_conversation(conversation_id: str):
    conn = get_conn()
    cur = conn.cursor()
    # Delete messages associated with the conversation
    cur.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    # Delete the conversation itself
    cur.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    conn.commit()
    conn.close()


def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    return conn
