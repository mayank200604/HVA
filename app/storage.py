# storage.py
import sqlite3
from datetime import datetime

DB_PATH = "chat.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
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

    conn.commit()
    conn.close()

def create_conversation(conversation_id: str):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO conversations (id, created_at) VALUES (?, ?)",
        (conversation_id, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def save_message(conversation_id, role, content, model=None):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO messages
           (conversation_id, role, content, model, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (conversation_id, role, content, model, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def load_recent_messages(conversation_id, limit=12):
    conn = sqlite3.connect(DB_PATH)
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
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, created_at FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (limit, offset)
    )
    rows = cur.fetchall()
    conn.close()
    return [{"id": r[0], "created_at": r[1]} for r in rows]


def get_conversation_messages(conversation_id):
    conn = sqlite3.connect(DB_PATH)
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
