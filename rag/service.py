import sys
import os
import asyncio

# Fix path to import from app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.app import call_groq_api, extract_text_from_model_response
from retriever import retrieve_documents
from prompt import build_rag_prompt

def call_llm(prompt):
    """
    Adapter to call the async Groq API from app.py synchronously.
    """
    messages = [{"role": "user", "content": prompt}]
    try:
        # Run the async function
        response = asyncio.run(call_groq_api(messages))
        return extract_text_from_model_response(response)
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

    # 4. Call LLM (using Groq from app.py)
    response = call_llm(prompt)

    return {
        "answer": response,
        "sources": list(set(doc.metadata.get("source") for doc in docs))
    }
