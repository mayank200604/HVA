# Frontend (src)

This folder contains the **React frontend** for the Hybrid Voice Assistant (HVA).  
It provides a modern, chat-centric UI that communicates with the FastAPI backend for chat, RAG, and image generation.

The frontend is built with **React + Vite**, styled using **Tailwind CSS**, and designed to behave like a real-time AI console.

---

## ✨ Features

- **ChatGPT-style chat interface**
  - Streaming responses (SSE)
  - Markdown rendering (code blocks, inline code)
  - Smooth typing indicators

- **Stateful chat UI**
  - Multiple chat sessions
  - Local chat history persistence (localStorage)
  - Each chat linked to a backend `conversation_id`

- **Image generation UI**
  - Dedicated image creation page
  - Preview generated images
  - Add generated images directly into chat history
  - Local image gallery with preview, download, and delete

- **RAG-powered floating assistant**
  - Floating Action Button (FAB)
  - Calls `/rag/chat` endpoint
  - Designed for document-grounded Q&A only

- **Authentication UI (placeholder)**
  - Login / signup screens
  - Auth logic intentionally stubbed for future integration

- **Phase-2 ready voice interface**
  - Voice page included as a placeholder
  - Clearly marked as future work

---

## 🧭 Application Routes

/ → Landing page
/auth → Login / Signup page (UI only)
/app → Main chat application
/images → Image generation page


---

## 🏗️ High-Level Frontend Architecture

React (Vite)
├─ Pages
│ ├─ LandingPage
│ ├─ AuthPage
│ ├─ ChatAppPage
│ ├─ ImageCreator
│ └─ VoiceSessionPage
│
├─ Components
│ └─ ChatFAB (RAG assistant)
│
└─ Local Storage
├─ chatHistory
├─ currentChatId
└─ generated_images

---

## 📂 Folder Structure

src/
├── pages/
│ ├── Landingpage.jsx # Marketing / intro page
│ ├── Authpage.jsx # Login & signup UI
│ ├── ChatAppPage.jsx # Main chat interface
│ ├── ImageCreator.jsx # Image generation UI
│ └── VoiceSessionPage.jsx # Phase-2 placeholder
│
├── components/
│ └── ChatFAB.jsx # Floating RAG assistant
│
├── main.jsx # App entry point & routing
├── index.css # Global styles (Tailwind)
└── README.md

---

## 💬 Chat Flow (Main App)

1. User sends a message from `ChatAppPage`
2. Frontend sends:
   - `message`
   - optional `conversation_id`
3. Backend streams responses via SSE
4. Frontend:
   - renders chunks progressively
   - updates backend `conversation_id` when received
   - persists chat locally

The frontend **does not manage context logic** — it relies entirely on the backend for conversation memory.

---

## 📚 RAG Assistant (ChatFAB)

- Visible only on the main chat route (`/app`)
- Uses a floating UI pattern
- Sends queries to:

- Designed specifically for **document-based queries**
- Maintains its own lightweight local message state

---

## 🖼️ Image Generation Flow

1. User navigates to `/images`
2. Prompt sent to backend `/generate_image`
3. Generated image preview shown
4. Image can be:
 - added to current chat
 - saved to local gallery
 - downloaded or deleted

Images are stored **locally** and referenced by URL.

---

## 🔒 State & Storage

The frontend uses **localStorage** for UI persistence only:

- `chatHistory` – chat UI state
- `currentChatId` – active chat
- `generated_images` – image gallery

**No sensitive data** is stored client-side.

---

## 🧪 Design Notes

- Frontend is intentionally decoupled from backend internals
- Backend is the single source of truth for:
- conversation memory
- routing
- RAG logic
- Auth and voice features are placeholders for future phases
- Focus is on clarity, UX, and debuggability

---

## 📌 Status

✅ UI feature complete  
✅ Integrated with backend APIs  
✅ Ready for demos and portfolio use  

Further work is optional and focused on:
- authentication integration
- voice support (Phase 2)
- UX polish

---
