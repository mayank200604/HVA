# RAG Module (Retrieval-Augmented Generation)

This folder contains the **Retrieval-Augmented Generation (RAG) pipeline** used by the HVA backend.  
It is responsible for loading documents, chunking them, generating embeddings, storing them in a vector database, and retrieving relevant context to support document-grounded responses.

The RAG pipeline is designed to be **modular, explicit, and independent** from the main chat logic.

---

## 🎯 Purpose

The RAG module enables the system to:
- Answer questions **based strictly on provided documents**
- Reduce hallucinations by grounding responses in retrieved context
- Support document-based Q&A through a dedicated `/rag/chat` endpoint

---

## 🧩 RAG Pipeline Overview

Markdown Documents
↓
Document Loader
↓
Text Chunking
↓
Embedding Generation
↓
Vector Store (Chroma)
↓
Similarity / MMR Retrieval
↓
Prompt Construction
↓
LLM Response (Groq)


---

## 📂 Folder Structure

rag/
├── rag_docs/ # Source markdown documents
├── loader.py # Loads markdown files
├── chunker.py # Splits documents into chunks
├── embeddings.py # Generates embeddings
├── vectordb.py # Loads Chroma vector store
├── retriever.py # Retrieves relevant chunks
├── prompt.py # Builds RAG-specific prompts
├── service.py # RAG execution service
├── query.py # CLI interface for testing
├── main.py # One-time ingestion script
├── requirements.txt # RAG-specific dependencies
├── chroma_db/ # Persisted vector database
└── README.md


---

## 📄 Module Responsibilities

### `loader.py`
- Loads `.md` files from `rag_docs/`
- Uses `UnstructuredMarkdownLoader`
- Attaches metadata such as source filename

---

### `chunker.py`
- Splits documents into overlapping chunks
- Uses `RecursiveCharacterTextSplitter`
- Adds chunk metadata for traceability

---

### `embeddings.py`
- Uses `sentence-transformers/all-MiniLM-L6-v2`
- Generates vector embeddings for each chunk
- Exposes embedding model for reuse

---

### `vectordb.py`
- Loads an existing **Chroma** vector store
- Does **not** create the database
- Raises an error if the vector DB does not exist

---

### `retriever.py`
- Retrieves relevant document chunks using:
  - Max Marginal Relevance (MMR)
- Used by both:
  - API (`/rag/chat`)
  - CLI testing

---

### `prompt.py`
- Builds strict RAG prompts
- Enforces rules:
  - Use only retrieved context
  - No assumptions
  - Neutral, guidance-oriented responses
- Prevents references to documents or sources in the final answer

---

### `service.py`
- End-to-end RAG execution logic
- Retrieves documents
- Builds prompt
- Calls Groq LLM via backend adapter
- Returns answer + source metadata

---

### `main.py`
- One-time ingestion script
- Loads documents
- Chunks them
- Embeds them
- Persists vectors to Chroma

Run this **before using RAG**.

---

### `query.py`
- CLI interface for testing RAG locally
- Useful for debugging retrieval and prompt behavior
- Does not require frontend or API server

---

## ▶️ How to Use

### 1️⃣ Add Documents
Place markdown files inside:

rag/rag_docs/


---

### 2️⃣ Ingest Documents
Run once:

```bash
python main.py

This creates the chroma_db/ vector store.

