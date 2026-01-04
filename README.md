# Hybrid Voice Assistant (HVA)

**HVA** is a modern, full-stack AI platform that unifies real-time conversational intelligence, document-grounded answers (RAG), and generative imagery into a single, seamless interface.

It is built with a **"Thin Client"** architecture where the **FastAPI backend** manages conversation state, ensuring robustness and persistence, while the **React frontend** delivers a snappy, streaming-first user experience.

---

## 🌟 Key Capabilities

### 🧠 Intelligent Conversational Core
- **Multi-Model Routing**: Automatically routes queries to the best model:
  - **Groq (Llama-3)** for general chat.
  - **Gemini (Flash/Pro)** for deep reasoning and coding tasks.
  - **Hugging Face (Flux)** for image generation.
- **Backend-Managed Memory**: Conversations are persisted in a SQLite database. The system "remembers" context across sessions without burdening the frontend.
- **Real-Time Streaming**: Responses are streamed token-by-token using Server-Sent Events (SSE) for perceived zero-latency.

### 📚 RAG (Retrieval-Augmented Generation)
- **"Ask Your Documents"**: A dedicated pipeline to answer questions based on a local knowledge base.
- **Vector Search**: Uses ChromaDB and semantic embeddings to find relevant context.
- **Memory-Aware**: RAG chats also respect conversation history, allowing for follow-up questions on retrieved data.

### 🎨 Generative Vision
- **Text-to-Image**: Integrated Flux.1 model support. Creates high-quality images from natural language prompts.
- **Gallery**: Local history of generated images.

---

## 📖 Component Documentation

Detailed documentation is available for each module:

- [**Frontend Documentation**](src/README.md)  
  *React, Tailwind, SSE Streaming logic, and Component structure.*

- [**Backend Documentation**](app/README.md)  
  *FastAPI app, Database schema (SQLite), API Endpoints, and Logging.*

- [**RAG Module Documentation**](rag/README.md)  
  *Document ingestion, Vector DB (Chroma), and Retrieval pipeline.*

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- API Keys (Groq, Gemini, Hugging Face)

### 1. Backend Setup
```bash
cd app
# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Create .env file with your API keys (see app/README.md for details)

# Run Server
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
The API handles database initialization automatically on first launch.

### 2. Frontend Setup
```bash
# In a new terminal
npm install

# Run Dev Server
npm run dev
```
Visit `http://localhost:5173` to launch HVA.

---

## 📂 Project Structure

```
HVA/
├── app/                  # FastAPI Backend & Database
├── rag/                  # RAG Pipeline & Vector Store
├── src/                  # React Frontend
├── rag_docs/             # Source documents for RAG
├── index.html            # App Entry Point
└── vite.config.js        # Build Config
```

---

## 🛠 Status & Roadmap

- ✅ **Backend Memory**: Fully implemented (SQLite).
- ✅ **RAG Pipeline**: Functional with dedicated endpoint.
- ✅ **Image Generation**: Integrated with Flux.1.
- ✅ **Streaming**: SSE implemented end-to-end.
- 🚧 **Voice Interface**: UI placeholder ready; backend processing pending Phase 2.
- 🚧 **Authentication**: UI ready; backend integration pending.
