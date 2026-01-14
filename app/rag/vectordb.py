import os
import logging
import threading

# Lazy import: Don't import Chroma at module level
from rag.embeddings import get_embedding_model, is_model_ready

# Use absolute path for production reliability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

logger = logging.getLogger(__name__)

# Global cache and loading state
_vectorstore_cache = None
_loading_lock = threading.Lock()
_is_loading = False
_load_failed = False
_load_error = None


def is_vectorstore_ready():
    """Check if vectorstore is ready to use."""
    return _vectorstore_cache is not None


def is_vectorstore_loading():
    """Check if vectorstore is currently loading."""
    return _is_loading


def get_rag_status():
    """Get comprehensive RAG system status."""
    from rag.embeddings import get_loading_status
    
    embedding_status = get_loading_status()
    
    if _vectorstore_cache is not None:
        vs_status = "ready"
        vs_message = "Vector database loaded"
    elif _is_loading:
        vs_status = "loading"
        vs_message = "Vector database loading..."
    elif _load_failed:
        vs_status = "failed"
        vs_message = f"Failed: {_load_error}"
    else:
        vs_status = "not_loaded"
        vs_message = "Not yet loaded"
    
    overall_ready = (_vectorstore_cache is not None and 
                     embedding_status["status"] == "ready")
    
    return {
        "rag_ready": overall_ready,
        "embedding": embedding_status,
        "vectorstore": {
            "status": vs_status,
            "message": vs_message
        }
    }


def get_vectorstore():
    """
    Load an existing Chroma vector store with caching.
    Thread-safe lazy initialization.
    NOTE: Chroma is imported lazily here to avoid slow startup!
    """
    global _vectorstore_cache, _is_loading, _load_failed, _load_error
    
    # If already loaded, return immediately
    if _vectorstore_cache is not None:
        logger.debug("Returning cached vectorstore")
        return _vectorstore_cache
    
    # If loading failed before, raise the error
    if _load_failed:
        raise RuntimeError(f"Vectorstore failed to load: {_load_error}")
    
    # Use lock to ensure only one thread loads the vectorstore
    with _loading_lock:
        # Double-check after acquiring lock
        if _vectorstore_cache is not None:
            return _vectorstore_cache
        
        if _load_failed:
            raise RuntimeError(f"Vectorstore failed to load: {_load_error}")
        
        _is_loading = True
        
        try:
            # Verify database exists
            if not os.path.exists(CHROMA_PATH):
                error_msg = (
                    f"Chroma DB directory not found at: '{CHROMA_PATH}'. "
                    f"Ensure 'app/rag/chroma_db' exists and contains the database files."
                )
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
            
            # Check for the actual database file
            chroma_sqlite = os.path.join(CHROMA_PATH, "chroma.sqlite3")
            if not os.path.exists(chroma_sqlite):
                error_msg = (
                    f"Chroma database file not found: '{chroma_sqlite}'. "
                    f"Database directory exists but is empty or incomplete."
                )
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
            
            logger.info(f"Loading Chroma DB from: {CHROMA_PATH}")
            
            # LAZY IMPORT: Import Chroma only when actually needed
            from langchain_community.vectorstores import Chroma
            
            # Get embedding model (has langchain-compatible interface)
            embedding_function = get_embedding_model()
            logger.info("Embedding function ready")
            
            # Load vectorstore
            vectorstore = Chroma(
                persist_directory=CHROMA_PATH,
                embedding_function=embedding_function
            )
            
            # Verify it has content
            try:
                count = vectorstore._collection.count()
                logger.info(f"[OK] Vectorstore loaded with {count} documents")
            except Exception as e:
                logger.warning(f"Could not verify document count: {e}")
            
            # Cache the vectorstore for future requests
            _vectorstore_cache = vectorstore
            _is_loading = False
            
            return vectorstore
            
        except Exception as e:
            _is_loading = False
            _load_failed = True
            _load_error = str(e)
            error_msg = f"Failed to load Chroma vectorstore: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg) from e


# Test
if __name__ == "__main__":
    print("Loading vector store...")
    vectorstore = get_vectorstore()
    print("[OK] Vector store loaded successfully")
    print(f"Number of documents: {vectorstore._collection.count()}")
