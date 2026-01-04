# HVA Backend (FastAPI)

This folder contains the **backend implementation** of the **Hybrid Voice Assistant (HVA)** chatbot system, built using **FastAPI**.

The backend provides a **multi-model conversational AI service** with persistent memory, streaming responses, image generation, and a separate Retrieval-Augmented Generation (RAG) pipeline.

---

## ✨ Features

### 🧠 Multi-Model Chat Orchestration
- **Groq** – default conversational responses  
- **Gemini** – code-related and complex reasoning queries  
- **Hugging Face** – image generation  

Model selection is handled automatically using lightweight intent-based routing, with fallback support.

---

### 💬 Stateful Conversations (Backend-Managed)
- Each conversation is identified using a `conversation_id`
- Chat history is stored in **SQLite**
- Backend automatically loads recent messages for context
- Frontend does **not** manage conversation memory

---

### ⚡ Streaming Responses
- Chat responses are streamed using **Server-Sent Events (SSE)**
- Enables progressive rendering of long responses
- Improves perceived latency and user experience

---

### 📚 Retrieval-Augmented Generation (RAG)
- Separate `/rag/chat` endpoint for document-grounded answers
- Uses a vector database (Chroma) for retrieval
- Shares the same conversation memory as normal chat
- Designed intentionally as a synchronous endpoint for clarity

---

### 🖼️ Image Generation
- Image generation via **Hugging Face Inference API**
- Generated images are:
  - Saved locally (original + thumbnail)
  - Served via a static endpoint
- Image generation is intentionally separated from chat

---

### 🛡️ Error Handling & Logging
- Centralized logging (stdout + file logging)
- Graceful user-facing error messages
- Automatic fallback from Gemini to Groq when required
- Detailed backend logs for debugging and tracing

---

## 🏗️ High-Level Architecture

Frontend (React)
|
v
FastAPI Backend
├─ /chat → Streaming chat (SSE)
├─ /rag/chat → Document-grounded chat
├─ /generate_image → Image generation
├─ /conversations → List conversations
└─ /conversation/{id} → Fetch conversation history
|
v
SQLite (chat.db) + Vector Store (Chroma)


---

## 📂 Folder Structure

app/
├── app.py # Main FastAPI application
├── storage.py # SQLite persistence layer
└── README.md


---

## 🔑 Environment Variables

Create a `.env` file inside the `app/` directory with the following:

GROQ_API_KEY=your_key_here
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions

GROQ_MODEL=llama-3.3-70b-versatile

GEMINI_API_KEY=your_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models

GEMINI_MODEL=gemini-2.5-flash

HF_API_KEY=your_key_here
HF_API_URL=https://router.huggingface.co

HF_MODEL=black-forest-labs/FLUX.1-dev


---

## ▶️ Running the Backend

From the `app/` directory:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
