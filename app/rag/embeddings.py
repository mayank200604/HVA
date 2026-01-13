import os
import logging
import threading

# Disable TensorFlow to avoid Keras warnings
os.environ['USE_TF'] = 'NO'
os.environ['USE_TORCH'] = 'YES'
os.environ['TRANSFORMERS_NO_ADVISORY_WARNINGS'] = 'true'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Use sentence-transformers directly
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Global cache and loading state
_embedding_model_cache = None
_loading_lock = threading.Lock()
_is_loading = False
_load_failed = False
_load_error = None


class SentenceTransformerEmbeddings:
    """
    Wrapper class that mimics HuggingFaceEmbeddings interface
    but uses SentenceTransformer directly (faster, no Keras issues).
    Compatible with existing Chroma vector database.
    """
    def __init__(self, model_name='sentence-transformers/all-MiniLM-L6-v2', device='cpu'):
        logger.info(f"Initializing SentenceTransformer: {model_name}")
        self.model = SentenceTransformer(model_name, device=device)
        logger.info("✅ Embedding model initialized successfully")
    
    def embed_documents(self, texts: list) -> list:
        """Embed a list of documents."""
        embeddings = self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return [emb.tolist() for emb in embeddings]
    
    def embed_query(self, text: str) -> list:
        """Embed a single query text."""
        embedding = self.model.encode(text, normalize_embeddings=True, show_progress_bar=False)
        return embedding.tolist()


def get_embedding_model():
    """
    Get or create cached embedding model instance.
    Thread-safe lazy initialization.
    """
    global _embedding_model_cache, _is_loading, _load_failed, _load_error
    
    # If already loaded, return immediately
    if _embedding_model_cache is not None:
        return _embedding_model_cache
    
    # If loading failed before, raise the error
    if _load_failed:
        raise RuntimeError(f"Embedding model failed to load: {_load_error}")
    
    # Use lock to ensure only one thread loads the model
    with _loading_lock:
        # Double-check after acquiring lock
        if _embedding_model_cache is not None:
            return _embedding_model_cache
        
        if _load_failed:
            raise RuntimeError(f"Embedding model failed to load: {_load_error}")
        
        _is_loading = True
        
        try:
            logger.info("Creating embedding model instance...")
            _embedding_model_cache = SentenceTransformerEmbeddings(
                model_name='sentence-transformers/all-MiniLM-L6-v2',
                device='cpu'
            )
            _is_loading = False
            return _embedding_model_cache
            
        except Exception as e:
            _is_loading = False
            _load_failed = True
            _load_error = str(e)
            error_msg = f"Failed to initialize embedding model: {str(e)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e


def is_model_ready():
    """Check if embedding model is ready to use."""
    return _embedding_model_cache is not None


def is_model_loading():
    """Check if embedding model is currently loading."""
    return _is_loading


def get_loading_status():
    """Get current loading status."""
    if _embedding_model_cache is not None:
        return {"status": "ready", "message": "Embedding model is loaded and ready"}
    elif _is_loading:
        return {"status": "loading", "message": "Embedding model is currently loading..."}
    elif _load_failed:
        return {"status": "failed", "message": f"Failed to load: {_load_error}"}
    else:
        return {"status": "not_loaded", "message": "Embedding model not yet loaded"}


def preload_embedding_model():
    """
    Disabled - model loads on first request.
    Returns False to indicate no preloading.
    """
    logger.info("⚡ RAG configured for lazy loading (model loads on first request)")
    logger.info("💡 This prevents slow startup - first RAG request may take 2-3 seconds")
    return False


# Standalone functions for direct use
def embed_query(text: str) -> list:
    """Embed a single text query."""
    model = get_embedding_model()
    return model.embed_query(text)


def embed_documents(texts: list) -> list:
    """Embed multiple documents."""
    model = get_embedding_model()
    return model.embed_documents(texts)


# Legacy function for compatibility
def get_embeddings(chunked_docs):
    """Legacy function for backward compatibility."""
    model = get_embedding_model()
    
    embedded_docs = []
    for doc in chunked_docs:
        embedding = model.embed_query(doc.page_content)
        embedded_docs.append({
            "content": doc.page_content,
            "metadata": doc.metadata,
            "embedding": embedding
        })
    return embedded_docs, model


if __name__ == "__main__":
    # Test the embedding model
    print("Testing embedding model...")
    model = get_embedding_model()
    
    test_text = "This is a test sentence."
    embedding = model.embed_query(test_text)
    print(f"✅ Single embedding dimension: {len(embedding)}")
    
    test_texts = ["First sentence", "Second sentence"]
    embeddings = model.embed_documents(test_texts)
    print(f"✅ Batch embeddings count: {len(embeddings)}")
    print(f"✅ Each embedding dimension: {len(embeddings[0])}")
