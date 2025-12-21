# HVA - AI-Powered Application

HVA is a full-stack web application combining a React frontend with a FastAPI backend, providing multiple AI-powered features including chat, image generation, and voice sessions.

## Project Overview

This project is a hybrid application with:
- **Frontend**: React 18 with Vite, Tailwind CSS, and React Router
- **Backend**: Python FastAPI with async support
- **AI Integrations**: Groq API, Google Gemini, Hugging Face

## Features Implemented

### Frontend (React + Vite)
- **Landing Page** (`Landingpage.jsx`) - Welcome and introduction page
- **Authentication** (`Authpage.jsx`) - User authentication system
- **Chat Application** (`ChatAppPage.jsx`) - Real-time chat interface powered by Groq LLM
- **Image Creator** (`ImageCreator.jsx`) - AI image generation using Hugging Face FLUX.1 model
- **Voice Session** (`VoiceSessionPage.jsx`) - Voice-based interaction capabilities
- **Particle Sphere** (`ParticleSphere.jsx`) - Interactive visual component
- **Responsive Design** - Styled with Tailwind CSS

### Backend (FastAPI)
- **Chat Completions** - Integration with Groq API for chat completions using llama-3.3-70b model
- **Image Generation** - FLUX.1-dev model integration via Hugging Face
- **Google Gemini Support** - Alternative AI model support
- **CORS Support** - Cross-origin request handling
- **Async Processing** - Non-blocking request handling
- **Environment Configuration** - `.env` file support for API keys

## Tech Stack

### Frontend
```
react: ^18.3.1
react-dom: ^18.3.1
react-router-dom: ^6.28.0
vite: ^6.0.0
tailwindcss: ^4.1.17
```

### Backend
```
fastapi
uvicorn[standard]
httpx
python-dotenv
pydantic
Pillow
python-multipart
aiofiles (optional)
```

## Project Structure

```
HVA/
├── src/                          # React source code
│   ├── pages/
│   │   ├── Landingpage.jsx      # Landing page
│   │   ├── Authpage.jsx         # Authentication page
│   │   ├── ChatAppPage.jsx      # Chat application
│   │   ├── ImageCreator.jsx     # Image generation
│   │   └── VoiceSessionPage.jsx # Voice interactions
│   ├── shared/
│   │   └── ParticleSphere.jsx   # Reusable visual component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── app/                          # Python FastAPI backend
│   ├── app.py                   # Main FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables (API keys)
├── index.html                   # HTML entry point
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── package.json                # Node.js dependencies
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.8+
- API Keys for:
  - Groq API (for chat)
  - Google Gemini (optional)
  - Hugging Face (for image generation)

### Installation

#### Frontend Setup
```bash
npm install
```

#### Backend Setup
```bash
cd app
pip install -r requirements.txt
```

### Configuration

1. Create a `.env` file in the `app/` directory with your API keys:
```
GROQ_API_KEY=your_groq_api_key
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=llama-3.3-70b-versatile

GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_MODEL=gemini-2.5-flash

HF_API_KEY=your_huggingface_api_key
HF_API_URL=https://router.huggingface.co
HF_MODEL=black-forest-labs/FLUX.1-dev
```

2. Create a `.env.local` file in the root directory if needed for frontend environment variables.

### Running the Application

#### Development Mode

**Terminal 1 - Frontend:**
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

**Terminal 2 - Backend:**
```bash
cd app
python -m uvicorn app:app --reload
```
The backend API will be available at `http://localhost:8000`

#### Build for Production

```bash
npm run build
```

#### Preview Production Build

```bash
npm run preview
```

## API Endpoints

The FastAPI backend provides the following main endpoints:

- **POST `/chat`** - Send a chat message and receive a completion
- **POST `/generate-image`** - Generate an image using Hugging Face FLUX.1
- **POST `/voice`** - Voice session endpoint (if implemented)

## Development Notes

- The project uses Vite for fast development and optimized builds
- Tailwind CSS is configured for utility-first styling
- CORS is enabled to allow frontend-backend communication
- Images are stored in the system's temp directory for cross-platform compatibility
- The backend uses async/await for non-blocking operations

## File Conventions

- React components use `.jsx` extension
- Python modules follow PEP 8 style guide
- Environment variables are managed through `.env` files
- Build artifacts are ignored via `.gitignore`

## Status

🚀 **In Development** - Core features are implemented. Voice session features may need additional development.

## Future Enhancements

- Enhanced voice processing capabilities
- User authentication persistence
- Database integration for chat history
- Streaming responses for real-time updates
- WebSocket support for live communication
- Additional AI model integrations

## Support

For issues or questions, refer to the API documentation or the FastAPI interactive docs at `http://localhost:8000/docs` (when backend is running).

---

**Last Updated**: December 21, 2025
