# Hybrid Voice Assistant (HVA)
### Architecture, Implementation & Roadmap

Hybrid Voice Assistant (HVA) is a full-stack conversational AI system that combines real-time chat, multi-model orchestration, image generation, and optional local Retrieval-Augmented Generation (RAG).  
This repository documents **what the system does, how it is built, the engineering challenges encountered, and the roadmap to production-grade readiness**.

All explanations are grounded in the actual codebase and internal project documentation.

---

## 🌐 Live Deployments

You can explore the current working versions here:

- **Frontend (Vercel)**  
  https://hva-6fhr.vercel.app/

- **Backend (Render)**  
  https://hva-ed6w.onrender.com

> Note: RAG is environment-controlled. In production deployments, it may be disabled to avoid cold-start latency.

---

## 1. Project Overview — What & Why

HVA is a **hybrid conversational assistant** that integrates:

- Multi-model conversational chat (LLM routing)
- Streaming responses using Server-Sent Events (SSE)
- Persistent conversation memory
- Text-to-image generation
- Optional local RAG for document-grounded answers

### Why this project exists

- To build a **single assistant** capable of:
  - General conversation
  - Code-heavy and reasoning-intensive queries
  - Grounded responses using private/local documents
- To explore **real-world AI engineering problems**:
  - Streaming UX
  - API unreliability
  - Cold starts
  - Persistence and memory
  - Model orchestration tradeoffs
- To keep RAG **optional and local**, preserving fast startup while allowing powerful document search during development.

---

## 2. High-Level Architecture & Data Flow

React Frontend
↓
FastAPI Backend
├─ Chat & SSE Streaming
├─ Model Routing
├─ Persistence (SQLite)
├─ Optional RAG Pipeline
└─ Image Generation
↓
External Model APIs / Local Vector DB


### Core request paths

#### `/chat` — Streaming chat
- Frontend sends a chat request
- Backend:
  - Loads recent messages from storage
  - Selects the best model via rule-based routing
  - Calls the model API
  - Saves messages
  - Streams the response via SSE in chunks

#### `/rag/chat` — RAG-powered chat (optional)
- Enabled only when `ENABLE_RAG=true`
- Backend:
  - Checks RAG readiness
  - Retrieves relevant document chunks from Chroma
  - Builds a context-aware prompt
  - Queries the LLM
  - Returns answer + source metadata

#### `/generate_image` — Image generation
- Uses Hugging Face inference
- Handles binary responses safely
- Saves and serves images locally

---

## 3. Repository Structure & Responsibilities

### `app/` — Backend
- `app.py`  
  Main FastAPI app: endpoints, SSE streaming, model routing, image generation, RAG orchestration.
- `storage.py`  
  SQLite persistence with WAL mode, migrations, and thread-safe access.
- `firestore_storage.py`  
  Experimental storage scaffold mirroring SQLite APIs.
- `README.md`, `FIXES_APPLIED.md`  
  Operational and debugging notes.

### `app/rag/` — RAG Pipeline
- `loader.py`, `chunker.py`  
  Document loading and chunking.
- `embeddings.py`  
  Sentence-Transformers wrapper with lazy, thread-safe loading.
- `vectordb.py`  
  Lazy Chroma vectorstore loader with readiness tracking.
- `retriever.py`  
  Diversity-aware retrieval logic.
- `prompt.py`  
  RAG prompt construction.
- `service.py`, `query.py`  
  CLI/testing utilities.

### `src/` — Frontend
- React UI with SSE integration
- LocalStorage-backed conversations
- Image generation UI
- RAG-specific chat handling

---

## 4. Phase Planning & Roadmap

### ✅ Phase 1 — Implemented (Current)

Phase 1 focuses on building a **working, end-to-end assistant** with core capabilities.

#### Features
- Conversational chat assistant
- Multi-model routing (chat, code/reasoning, image)
- Streaming responses via SSE
- Persistent conversation history (SQLite)
- Text-to-image generation
- Optional local RAG support
- Graceful handling of API failures and retries
- Lazy loading of heavy RAG components

#### Live Access
- Frontend: https://hva-6fhr.vercel.app/
- Backend: https://hva-ed6w.onrender.com

---

### 🚀 Phase 2 — Planned (In Progress / Future)

Phase 2 focuses on **multi-modal interaction, scalability, and production hardening**.

#### 🎧 Voice & Multi-Modal Capabilities
- Speech-to-Text (STT) input
- Text-to-Speech (TTS) responses
- Multi-voice support
- Optional wake-word detection
- Real-time voice conversation mode

#### 📚 Advanced RAG Enhancements
- One-click document ingestion
- Automatic re-indexing and versioning
- Inline citations with excerpts
- Confidence scoring for answers
- Retrieval threshold tuning
- Evaluation pipeline for RAG accuracy

#### ☁️ Backend Scalability & Reliability
- Replace SQLite with PostgreSQL or managed DB
- Connection pooling & migrations
- Background workers for:
  - RAG ingestion
  - Long-running model calls
  - Image generation
- Horizontal scaling readiness

#### 📊 Observability & Monitoring
- Structured logging
- Metrics (latency, error rates, retries)
- Alerting for API failures and RAG load issues
- Tracing for request flows

#### 🔐 Security & Access Control
- Authentication (JWT / OAuth)
- Per-user rate limiting & quotas
- Secure API key management
- Role-based access where needed

#### 🎨 Frontend & UX Improvements
- Better streaming indicators
- Conversation export & sharing
- Prompt editing tools
- Client SDK for easier integration
- Improved RAG loading feedback

---

## 5. Engineering Challenges & Solutions

### RAG Cold-Start Performance
**Problem:**  
Embedding and vectorstore loading caused slow startup and request timeouts.

**Solution:**  
- Environment-gated RAG
- Lazy, thread-safe loading
- Background initialization
- `/rag/status` endpoint for readiness checks

---

### Streaming UX vs Provider Constraints
**Problem:**  
Different model providers expose inconsistent streaming APIs.

**Solution:**  
- Application-level SSE chunking
- Deterministic event structure
- Provider-agnostic streaming logic

---

### Upstream API Failures
**Problem:**  
Rate limits, intermittent failures, authentication errors.

**Solution:**  
- Exponential backoff retries
- Graceful fallbacks between models
- Defensive response parsing

---

### Concurrent DB Access
**Problem:**  
SQLite blocking the async event loop.

**Solution:**  
- WAL mode
- Thread-offloaded DB operations
- Experimental Firestore scaffold for future scaling

---

## 6. Current Limitations

- No true token-level provider streaming
- SQLite not suitable for high-concurrency production
- Manual RAG ingestion
- Limited observability
- No authentication or per-user quotas

---

## 7. Production-Grade Next Steps (Prioritized)

1. Move persistence to PostgreSQL or managed DB
2. Implement real model token streaming
3. Add robust RAG ingestion & re-indexing pipeline
4. Introduce metrics, tracing, and alerting
5. Add authentication and rate limiting
6. Improve RAG citations and evaluation

---

## 8. Concluding Assessment

HVA is a **well-engineered prototype** that demonstrates practical AI system design:

- Clear separation of concerns
- Thoughtful tradeoffs for startup vs capability
- Defensive handling of real-world API issues
- Modular RAG architecture

Reaching production readiness requires **operational hardening**, not architectural redesign — the foundations are already in place.

---

### System flow (simplified)

