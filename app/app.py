import asyncio
import os
import uuid
import tempfile
from io import BytesIO
from PIL import Image 
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import httpx
from dotenv import load_dotenv
import json
import base64
import re
import logging
import sys

# Add parent directory to sys.path to access 'rag' package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("app.log", encoding='utf-8')
    ]
)
logger = logging.getLogger("hva_app")

from storage import init_db, create_conversation, save_message, load_recent_messages, get_all_conversations, get_conversation_messages
from rag.retriever import retrieve_documents
from rag.prompt import build_rag_prompt


# Debug: print the absolute path of the running file
logger.info(f"🔥 RUNNING FILE: {os.path.abspath(__file__)}")

init_db()


# Load environment variables from .env file in the same directory as this script
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = os.getenv("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta/models")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

HF_API_KEY = os.getenv("HF_API_KEY")
HF_API_URL = os.getenv("HF_API_URL", "https://router.huggingface.co")
HF_MODEL = os.getenv("HF_MODEL", "black-forest-labs/FLUX.1-dev")


# Use tempfile.gettempdir() for cross-platform compatibility (Windows/Linux/Mac)
IMAGE_DIR = os.path.join(tempfile.gettempdir(), "generated_images")
os.makedirs(IMAGE_DIR, exist_ok=True)


if not GROQ_API_KEY:
    raise RuntimeError("Set GROQ_API_KEY in environment (see .env.example)")
if not GROQ_API_URL:
    raise RuntimeError("Set GROQ_API_URL in environment (see .env.example)")
if not HF_API_KEY:
    raise RuntimeError("Set HF_API_KEY in environment (see .env.example)")

app = FastAPI(title="HVA Chatbot (FastAPI)", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for generated images
app.mount("/generated_images", StaticFiles(directory=IMAGE_DIR), name="generated_images")

# --- Pydantic Models ---
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None  # Firebase user ID
    max_tokens: Optional[int] = 1000

class ImageGenRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    size: Optional[str] = None  # ignored for now
    style: Optional[str] = None  # ignored for now

# --- Utility Functions ---

def save_file_sync(path: str, data: bytes):
    with open(path, "wb") as f:
        f.write(data)

async def safe_save_message(conversation_id: str, role: str, content: str, model: Optional[str] = None):
    """Safely save message to DB without blocking, logging errors instead of raising."""
    if not conversation_id:
        return
    try:
        await asyncio.to_thread(save_message, conversation_id, role, content, model)
    except Exception as e:
        logger.warning(f"Failed to save {role} message: {e}")
# simple router: pick model string based on user text
def pick_model_for_request(text: str) -> str:
    t = text.lower()

    # Code / complex reasoning
    if any(k in t for k in [
        "code", "bug", "implement", "refactor",
        "explain this code", "error", "stack trace"
    ]):
        return "gemini"

    # Explicit image generation ONLY
    image_triggers = [
        "generate image",
        "create an image",
        "draw an image",
        "picture of",
        "image of",
        "illustration of",
        "sketch of",
        "paint an image"
    ]

    if any(k in t for k in image_triggers):
        return "hf"

    return "groq"


async def call_groq_api(
    messages: List[Dict[str, str]],
    max_tokens: int = 800,
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.7,
    top_p: float = 0.7
) -> Dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    body = {
        "model": model or DEFAULT_GROQ_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p
    }

    # remove None values (just in case)
    body = {k: v for k, v in body.items() if v is not None}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(GROQ_API_URL, headers=headers, json=body)
        resp.raise_for_status()
        try:
            return resp.json()
        except ValueError:
            raise HTTPException(status_code=502, detail="Upstream API returned empty or invalid JSON response.")
    

async def call_gemini_api(
    messages: List[Dict[str, str]],
    max_tokens: int = 800,
    model: str = "gemini-2.5-flash",
    temperature: float = 0.7,
    top_p: float = 0.7
    ) -> Dict[str, Any]:

    model_name = model or DEFAULT_GEMINI_MODEL
    url = f"{GEMINI_API_URL}/{model_name}:generateContent?key={GEMINI_API_KEY}"

    headers = {"Content-Type": "application/json"}

    # Collect system messages
    system_texts = []
    contents = []

    for msg in messages:
        role = msg.get("role")
        text = msg.get("content", "")

        if role == "system":
            if text:
                system_texts.append(text)

        elif role == "user":
            contents.append({"role": "user", "parts": [{"text": text}]})

        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": text}]})

    # Prepend system instructions to the FIRST user message
    if system_texts and contents:
        prefix = "\n\n".join(system_texts) + "\n\n"
        contents[0]["parts"][0]["text"] = prefix + contents[0]["parts"][0]["text"]

    # If somehow no user message exists (rare edge case)
    if not contents:
        contents.append({
            "role": "user",
            "parts": [{"text": "\n\n".join(system_texts)}]
        })

    body = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
            "topP": top_p,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        try:
            return resp.json()
        except ValueError:
            raise HTTPException(status_code=502, detail="Upstream API returned empty or invalid JSON response.")


async def call_hf_image_api(
    messages: List[Dict[str, str]],
    model: str = None
) -> Dict[str, Any]:

    # choose model
    model_name = model or HF_MODEL
    # Build Hugging Face Router API URL: https://router.huggingface.co/hf-inference/models/<model>
    url = f"{HF_API_URL}/hf-inference/models/{model_name}"

    if not HF_API_KEY:
        raise HTTPException(status_code=500, detail="HF_API_KEY not set or empty in environment.")


    # 1️⃣ Collect system + user messages into one prompt
    system_texts = []
    user_texts = []

    for msg in messages:
        role = msg.get("role")
        text = msg.get("content", "")

        if role == "system" and text:
            system_texts.append(text)

        elif role == "user" and text:
            user_texts.append(text)

    # 2️⃣ Build the final prompt
    prompt = ""
    if system_texts:
        prompt += "\n".join(system_texts) + "\n\n"
    if user_texts:
        prompt += "\n".join(user_texts)

    if not prompt.strip():
        prompt = "Generate an image."

    headers = {
        "Authorization": f"Bearer {HF_API_KEY.strip()}",
        "Content-Type": "application/json",
    }

    # 3️⃣ Create request body in Hugging Face format
    body = {
        "inputs": prompt,
        "parameters": {
            "num_inference_steps": 20,
            "guidance_scale": 7.5,
        }
    }

    # 4️⃣ Call Hugging Face Inference API
    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            resp = await client.post(url, headers=headers, json=body)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Hugging Face API request failed: {str(e)}")

        # Handle different response status codes
        if resp.status_code == 503:
            # Model is loading, might need to wait
            error_text = resp.text
            try:
                error_json = resp.json()
                error_text = error_json.get("error", error_json.get("message", error_text))
            except:
                pass
            raise HTTPException(status_code=503, detail=f"Model is loading, please try again in a moment: {error_text}")
        
        if resp.status_code == 404:
            error_text = f"Model '{model_name}' not found. Check if the model name is correct."
            try:
                error_json = resp.json()
                error_text = error_json.get("error", error_json.get("message", error_text))
            except:
                pass
            raise HTTPException(status_code=404, detail=f"Hugging Face API error: {error_text}")
        
        if resp.status_code >= 400:
            error_text = resp.text
            try:
                error_json = resp.json()
                error_text = error_json.get("error", error_json.get("message", error_json.get("detail", error_text)))
            except:
                pass
            raise HTTPException(status_code=resp.status_code, detail=f"Hugging Face API error ({resp.status_code}): {error_text}")

        # Check content type to determine if it's an image or JSON error
        content_type = resp.headers.get("content-type", "").lower()

        
        if "application/json" in content_type:
            # Might be an error response in JSON format
            try:
                error_json = resp.json()
                if "error" in error_json:
                    raise HTTPException(status_code=502, detail=f"Hugging Face API error: {error_json.get('error')}")
            except:
                pass

        # Hugging Face returns image bytes directly (binary PNG/JPEG)
        # Convert to base64 for consistency with existing code
        image_bytes = resp.content
        if not image_bytes or len(image_bytes) < 100:
            raise HTTPException(status_code=502, detail="Hugging Face API returned empty or invalid image response")
        
        # Convert binary image to base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Return in format compatible with existing extraction logic
        return {
            "artifacts": [{
                "base64": image_base64
            }]
        }
    
        
    
RETRY_STATUS_CODES = {429, 500, 502, 503, 504}

async def call_with_retry(call_fn, retries=3):
    for attempt in range(retries):
        try:
            return await call_fn()
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            status = e.response.status_code if e.response else None
            if status in RETRY_STATUS_CODES:
                await asyncio.sleep(2 ** attempt)
            else:
                raise
    raise RuntimeError("Upstream model overloaded after retries")


async def call_preferred_api(
    model: str,
    messages: List[Dict[str,str]],
    max_tokens: int = 800,
    temperature: float = 0.7,
    top_p: float = 0.9,
    stream: bool = False) -> Dict[str, Any]:
    
    async def _call():
        model_l = model.lower()
        if model_l == "groq":
            return await call_groq_api(messages, max_tokens, temperature=temperature, top_p=top_p)
        elif model_l == "gemini":
            return await call_gemini_api(messages, max_tokens, temperature=temperature, top_p=top_p)
        elif model_l in ("hf", "huggingface"):
            return await call_hf_image_api(messages)
        else:
            raise ValueError(f"Unknown model: {model}")

    return await call_with_retry(_call)

def extract_text_from_model_response(resp: Dict[str, Any]) -> str:
    """
    Extracts assistant text from:
    - Gemini responses (candidates → content → parts → text)
    - Groq/OpenAI style (choices → message → content)
    - Other common providers (output, text)
    - Fallback to stringified response
    """

    if isinstance(resp, dict) and "artifacts" in resp:
        raise RuntimeError("Image response passed to text extractor")

    if not resp:
        return ""

    # --- 1) Gemini-style ---
    try:
        candidates = resp.get("candidates") or []
        if candidates:
            content = candidates[0].get("content") or {}

            # content may contain parts: [{"text": "..."}]
            parts = content.get("parts") or []
            texts = []
            for p in parts:
                t = p.get("text")
                if isinstance(t, str):
                    texts.append(t)
            if texts:
                return "".join(texts)

            # some Gemini variants may return a direct string in content
            if isinstance(content, str) and content.strip():
                return content
    except Exception:
        pass

    # --- 2) Groq/OpenAI-style ---
    try:
        c = resp.get("choices", [{}])[0].get("message", {}).get("content")
        if isinstance(c, str) and c.strip():
            return c
    except Exception:
        pass

    # --- 3) Common fallbacks ---
    out = resp.get("output")
    if isinstance(out, str) and out.strip():
        return out

    txt = resp.get("text")
    if isinstance(txt, str) and txt.strip():
        return txt

    # --- 4) Other Gemini fallback: candidates[0].content as string ---
    try:
        candidates = resp.get("candidates") or []
        if candidates:
            content = candidates[0].get("content")
            if isinstance(content, str) and content.strip():
                return content
    except Exception:
        pass

    # --- 5) Final fallback ---
    return str(resp)

# system prompt (global)
HVA_SYSTEM_PROMPT = """You are the HVA assistant. Your name is FURIOUS.

GLOBAL RULES (apply unless a request-specific override is provided):

1. Answer exactly what the user asks — nothing more.
2. Keep replies minimal, direct, and strictly relevant unless the user clearly requests elaboration, suggestions, conversation, or open-ended discussion.
3. When the user greets (e.g., "hi", "hello"), respond with a friendly greeting AND a short offer to help. Example: "Hi! How can I help you today?"
4. When the user asks for a "brief" answer, provide a short but meaningful 1–2 sentence summary (not a single word).
5. You may give suggestions ONLY when the user explicitly or implicitly invites them (e.g., "what do you think?", "any suggestions?", "help me", "what should I do?", general open-ended questions).
6. Do not add extra explanations, headings, disclaimers, or examples unless the user asks for them.
7. Maintain consistent capitalization and polite tone.
8. Follow strict minimal rules for all other messages.
9. Can use Emojis sparingly to enhance friendliness, but only when appropriate."""

# per-request override for Gemini when user intent is "code"
GEMINI_CODE_OVERRIDE = (
    "REQUEST-LEVEL OVERRIDE (code): For THIS REQUEST ONLY, output a SINGLE fenced code block "
    "in valid Markdown. The fenced block MUST begin with ```python on its own line, followed by "
    "the code on separate new lines, and end with ``` on its own line. Do NOT place anything "
    "before or after the fenced block. Do NOT include inline code, comments, explanations, "
    "blank lines outside the block, or extra text. The entire response MUST be only the fenced "
    "code block in multi-line format."
)

# per-request override for Gemini when user intent is "creative"
GEMINI_CREATIVE_OVERRIDE = (
    "REQUEST-LEVEL OVERRIDE (creative): Be helpful and expressive for this request. Use Markdown "
    "as appropriate and provide a natural, creative response."
)

# --- Streaming Helper ---
async def stream_response(req: ChatRequest):
    """
    Generator that yields Server-Sent Events (SSE) format strings.
    Each event contains a JSON chunk of the streamed response.
    """
    if not req.message or not req.message.strip():
        yield f"data: {json.dumps({'error': 'Message content is required.'})}\n\n"
        return

    # --- 1️⃣ Handle conversation ID ---
    conversation_id = req.conversation_id
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    # Ensure conversation exists in DB
    try:
        await asyncio.to_thread(create_conversation, conversation_id, req.user_id)
    except Exception as e:
        logger.warning(f"Failed to ensure conversation exists: {e}")
    
    # --- 2️⃣ Load recent messages from database ---
    past_messages = load_recent_messages(conversation_id, limit=12)
    
    # --- 3️⃣ Build message list with system prompt and history ---
    messages: List[Dict[str, str]] = [{"role": "system", "content": HVA_SYSTEM_PROMPT}]
    
    for role, content in past_messages:
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": req.message})

    model_choice = pick_model_for_request(req.message)
    model_choice = (model_choice or "groq").lower()

    # defaults
    temperature = 0.7
    top_p = 0.9
    max_tokens = req.max_tokens or 800

    # Gemini overrides
    if model_choice == "gemini" and any(
    k in req.message.lower() for k in ["creative", "poem", "story", "write"]
    ):
        messages.append({"role": "system", "content": GEMINI_CREATIVE_OVERRIDE})

    elif model_choice == "gemini" and any(
        k in req.message.lower() for k in ["code", "bug", "error", "stack trace"]
    ):
        messages.append({"role": "system", "content": GEMINI_CODE_OVERRIDE})

    # Image generation special case
    if model_choice == "hf":
        yield f"data: {json.dumps({'type':'error','detail':'Image generation is not supported in chat. Use /generate_image.'})}\n\n"
        return

    # ------------------ MAIN FLOW ------------------
    try:
        # --- 4️⃣ Save user message to database ---
        await safe_save_message(conversation_id, "user", req.message, None)
        
        response = await call_preferred_api(
            model_choice,
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            stream=False,
        )

        if isinstance(response, dict) and "artifacts" in response:
            raise RuntimeError("Image response reached chat pipeline")

        reply = extract_text_from_model_response(response) or ""

        if not reply.strip():
            reply = "[DEBUG] Empty response from model."

        # --- 5️⃣ Save assistant reply to database ---
        await safe_save_message(conversation_id, "assistant", reply, model_choice)

        # --- stream chunks ---
        chunk_size = 64
        accumulated = ""

        for i in range(0, len(reply), chunk_size):
            chunk_text = reply[i:i+chunk_size]
            accumulated += chunk_text
            chunk = {
                "type": "chunk",
                "content": chunk_text,
                "accumulated": accumulated
            }
            if i == 0:
                chunk["conversation_id"] = conversation_id
            
            yield f"data: {json.dumps(chunk)}\n\n"

        # --- final event ---
        completion = {
            "type": "done",
            "content": reply,
            "conversation_id": conversation_id  # Send conversation_id back to frontend
        }
        yield f"data: {json.dumps(completion)}\n\n"

    # ------------------ ERRORS ------------------
    except httpx.HTTPStatusError as e:
        status = e.response.status_code if e.response else None
        body = e.response.text if e.response else str(e)

        if model_choice == "gemini" and status in (401, 403, 404):
            try:
                # Rebuild message list for fallback
                fallback_msgs = [{"role": "system", "content": HVA_SYSTEM_PROMPT}]
                for role, content in past_messages:
                    fallback_msgs.append({"role": role, "content": content})
                fallback_msgs.append({"role": "user", "content": req.message})

                response = await call_preferred_api(
                    "groq",
                    fallback_msgs,
                    max_tokens=max_tokens,
                    temperature=0.0,
                    top_p=1.0,
                    stream=False,
                )

                reply = extract_text_from_model_response(response) or "[DEBUG] Empty fallback response."

                # --- Save fallback response to database ---
                await safe_save_message(conversation_id, "assistant", reply, "groq")

                chunk_size = 12
                accumulated = ""

                for i in range(0, len(reply), chunk_size):
                    chunk_text = reply[i:i+chunk_size]
                    accumulated += chunk_text
                    chunk = {
                        "type": "chunk",
                        "content": chunk_text,
                        "accumulated": accumulated
                    }
                    if i == 0:
                        chunk["conversation_id"] = conversation_id

                    yield f"data: {json.dumps(chunk)}\n\n"

                completion = {
                    "type": "done",
                    "content": reply,
                    "conversation_id": conversation_id
                }
                yield f"data: {json.dumps(completion)}\n\n"

            except Exception:
                yield f"data: {json.dumps({'type':'error','detail':'gemini fallback failed'})}\n\n"
        else:
            yield f"data: {json.dumps({'type':'error','detail':'Service is temporarily unavailable (429/5xx). Please try again later.'})}\n\n"

    except httpx.RequestError as e:
        yield f"data: {json.dumps({'type':'error','detail': str(e)})}\n\n"

    except Exception as e:
        logger.error(f"Stream error: {e}", exc_info=True)
        yield f"data: {json.dumps({'type':'error','detail':'An internal error occurred.'})}\n\n"


# --- Route Handlers ---
@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Streams chat response as Server-Sent Events (SSE).
    Frontend can subscribe to the stream and display responses progressively.
    """
    return StreamingResponse(
        stream_response(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/generate_image")

async def generate_image(req: ImageGenRequest):
    """
    Generates an image via the configured image provider and saves thumbnail + original.
    Returns a URL to the thumbnail.
    """
    model_choice = "hf"  # For now, only HF is supported for images
    # Build messages for image generation - only use user prompt (no system prompt needed)
    messages = [{"role": "user", "content": req.prompt}]

    try:
        response = await call_preferred_api(model_choice, messages, max_tokens=1, temperature=0.0, top_p=1.0, stream=False)
        logger.debug(f"Image API response type: {type(response)}")
        if isinstance(response, dict):
            logger.debug(f"Image API response keys: {list(response.keys())}")
            if "artifacts" in response:
                logger.debug(f"Artifacts count: {len(response.get('artifacts', []))}")
                if response.get("artifacts"):
                    artifact = response["artifacts"][0]
                    logger.debug(f"First artifact keys: {list(artifact.keys()) if isinstance(artifact, dict) else 'not a dict'}")
        if isinstance(response, dict) and "error" in response:
            logger.debug(f"Error in response: {response.get('error')}")
    except HTTPException as e:
        logger.debug(f"HTTPException from API: {e.detail}")
        return JSONResponse(status_code=e.status_code, content={"error": "upstream_error", "detail": e.detail})
    except Exception as e:
        logger.error(f"Exception calling API: {e}", exc_info=True)
        return JSONResponse(status_code=502, content={"error": "upstream_error", "detail": str(e)})

    # Check if response contains an error
    if isinstance(response, dict) and response.get("error"):
        logger.debug(f"API returned error: {response.get('error')}")
        return JSONResponse(status_code=502, content={"error": "upstream_error", "detail": response.get("error")})

    # try to extract base64
    b64 = extract_hf_base64(response)
    logger.debug(f"Extracted b64: {b64[:50] if b64 else 'None'}...")
    
    if not b64:
        # If HF API returns 'error' dict, surface it
        if isinstance(response, dict) and response.get("error"):
            return JSONResponse(status_code=502, content={"error": "upstream_error", "detail": response.get("error")})
        return JSONResponse(status_code=500, content={"error":"no_image_found","meta": str(type(response)), "response_keys": list(response.keys()) if isinstance(response, dict) else str(response)})

    # sanitize and decode
    b64_clean = "".join(b64.split())
    if len(b64_clean) < 100:
        return JSONResponse(status_code=500, content={"error":"image_too_small","len": len(b64_clean)})

    try:
        img_bytes = base64.b64decode(b64_clean)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error":"decode_failed","detail": str(e)})

    mime = "image/png" if b64_clean.startswith("iVBOR") else "image/jpeg"
    ext = "png" if mime == "image/png" else "jpg"
    img_id = str(uuid.uuid4())
    orig_name = f"{img_id}_orig.{ext}"
    orig_path = os.path.join(IMAGE_DIR, orig_name)
    try:
        await asyncio.to_thread(save_file_sync, orig_path, img_bytes)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error":"save_failed","detail": str(e)})

    # Create thumbnail (JPEG)
    thumb_name = f"{img_id}_thumb.jpg"
    thumb_path = os.path.join(IMAGE_DIR, thumb_name)
    try:
        im = Image.open(BytesIO(img_bytes))
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.thumbnail((512,512), Image.LANCZOS)
        im.save(thumb_path, format="JPEG", quality=85, optimize=True)
    except Exception:
        # fallback copy original as thumb if processing fails
        try:
            # try writing original bytes as thumb (may be png/jpg)
            await asyncio.to_thread(save_file_sync, thumb_path, img_bytes)
            thumb_name = orig_name
            thumb_path = orig_path
        except Exception as e:
            return JSONResponse(status_code=500, content={"error":"thumbnail_failed","detail": str(e)})

    image_url = f"/generated_images/{thumb_name}"
    return {"url": image_url, "meta": {"mime": mime, "orig": orig_name, "thumb": thumb_name, "base64_len": len(b64_clean)}}

# --- Image generation endpoint ---
def extract_hf_base64(resp: dict) -> Optional[str]:
    if not isinstance(resp, dict):
        return None

    artifacts = resp.get("artifacts")
    if not isinstance(artifacts, list) or not artifacts:
        return None

    b64 = artifacts[0].get("base64")
    if isinstance(b64, str) and len(b64) > 100:
        return "".join(b64.split())

    return None


# --- Serve generated image files ---
@app.get("/generated_images/{filename}")
async def serve_generated_image(filename: str):
    if not re.match(r'^[A-Za-z0-9_\-\.]+$', filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")
    media_type = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
    return FileResponse(path, media_type=media_type)

# --- Optional cleanup helper (call from scheduled job) ---
class RagRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None  # Firebase user ID for user-specific RAG chats

@app.post("/rag/chat")
async def rag_chat_endpoint(req: RagRequest):
    """
    RAG-based chat endpoint.
    Retrieves info from rag_docs and answers using Groq.
    """
    try:
        # Handle conversation ID
        conv_id = req.conversation_id
        if not conv_id:
            conv_id = f"rag-{uuid.uuid4()}"

        # Ensure conversation exists
        try:
            await asyncio.to_thread(create_conversation, conv_id, req.user_id)  # RAG conversations now user-specific
        except Exception as e:
            logger.warning(f"Failed to ensure RAG conversation exists: {e}")

        # Save user message
        past_messages = []
        try:
            past_messages = await asyncio.to_thread(load_recent_messages, conv_id, limit=12)
            await safe_save_message(conv_id, "user", req.message, None)
        except Exception as e:
            logger.warning(f"Failed to load RAG history: {e}")

        # 1. Retrieve documents (run in threadpool to avoid blocking event loop)
        docs = await asyncio.to_thread(retrieve_documents, req.message)
        
        # 2. Build context
        if not docs:
            context = "No specific documents found."
        else:
            context = "\n\n".join(
                f"Content: {doc.page_content}"
                for doc in docs
            )
        
        # 3. Build prompt
        prompt = build_rag_prompt(context, req.message)
        
        # 4. Call LLM (reuse existing Groq logic)
        messages = []
        for r, c in past_messages:
            messages.append({"role": r, "content": c})
        messages.append({"role": "user", "content": prompt})
        
        # We use call_preferred_api 'groq' specifically as requested
        response = await call_preferred_api(
            model="groq",
            messages=messages,
            max_tokens=700,
            temperature=0.2
        )
        
        reply = extract_text_from_model_response(response)
        
        # Save assistant message
        await safe_save_message(conv_id, "assistant", reply, "groq")

        return {
            "reply": reply,
            "conversation_id": conv_id
        }
    except Exception as e:
        logger.error(f"RAG Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred while processing your request.")


@app.get("/conversations")
def list_conversations(user_id: str):
    """Get all conversations for a specific user (user_id is required)"""
    if not user_id or user_id.strip() == "":
        raise HTTPException(status_code=400, detail="user_id is required")
    return get_all_conversations(user_id=user_id, limit=100)


@app.get("/conversation/{conversation_id}")
def get_conversation(conversation_id: str):
    return get_conversation_messages(conversation_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000)