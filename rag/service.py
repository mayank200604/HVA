import sys
import os
import asyncio
import httpx
from dotenv import load_dotenv

# Fix path to import from rag module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from rag.retriever import retrieve_documents
    from rag.prompt import build_rag_prompt
except ImportError:
    from retriever import retrieve_documents
    from prompt import build_rag_prompt

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'app', '.env'))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")

def call_llm(prompt):
    """
    Call Groq API directly without importing from app.py to avoid circular imports.
    """
    if not GROQ_API_KEY:
        return "Error: GROQ_API_KEY not set in environment"
    
    messages = [{"role": "user", "content": prompt}]
    
    async def _call_api():
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        body = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "max_tokens": 700,
            "temperature": 0.2
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            # Extract text from response
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    try:
        return asyncio.run(_call_api())
    except Exception as e:
        return f"Error calling LLM: {str(e)}"

def generate_rag_response(query):
    # 1. Retrieve documents
    docs = retrieve_documents(query)

    # 2. Build context
    context = "\n\n".join(
        f"[Source: {doc.metadata.get('source')}]\n{doc.page_content}"
        for doc in docs
    )

    # 3. Build prompt
    prompt = build_rag_prompt(context, query)

    # 4. Call LLM (using direct Groq API call)
    response = call_llm(prompt)

    return {
        "answer": response,
        "sources": list(set(doc.metadata.get("source") for doc in docs))
    }
