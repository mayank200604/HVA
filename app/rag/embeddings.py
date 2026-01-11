import logging
import os
# Fix Keras 3 compatibility issue with transformers
os.environ['TF_USE_LEGACY_KERAS'] = '1'
from langchain_community.embeddings import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

# Global cache for embedding model to avoid reloading on every request
_embedding_model_cache = None

def get_embedding_model():
    """
    Get or create cached embedding model instance.
    Production-safe with detailed logging.
    """
    global _embedding_model_cache
    
    if _embedding_model_cache is not None:
        return _embedding_model_cache
    
    logger.info("Initializing HuggingFace embedding model (sentence-transformers/all-MiniLM-L6-v2)...")
    
    try:
        _embedding_model_cache = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},  # Explicitly use CPU
            encode_kwargs={'normalize_embeddings': True}  # Normalize for better similarity
        )
        logger.info("Embedding model initialized successfully")
        return _embedding_model_cache
        
    except Exception as e:
        error_msg = f"Failed to initialize embedding model: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from e


def preload_embedding_model():
    """
    Preload the embedding model at application startup.
    This prevents timeout issues on the first RAG request.
    
    Call this from FastAPI's @app.on_event("startup") to ensure
    the model is loaded before any requests arrive.
    """
    logger.info("🔄 Preloading embedding model at startup...")
    try:
        model = get_embedding_model()
        # Test the model to ensure it's fully loaded
        test_embedding = model.embed_query("test")
        logger.info(f"✅ Embedding model preloaded successfully (dimension: {len(test_embedding)})")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to preload embedding model: {str(e)}", exc_info=True)
        return False


def get_embeddings(chunked_docs):
    embedding_model = get_embedding_model()
    
    embedded_docs = []
    for doc in chunked_docs:
        embedding = embedding_model.embed_query(doc.page_content)
        embedded_docs.append({
            "content": doc.page_content,
            "metadata": doc.metadata,
            "embedding": embedding
        })
    return embedded_docs, embedding_model

if __name__ == "__main__":
    from rag.loader import load_md_files
    from rag.chunker import chunk_documents
    docs = load_md_files()
    chunked_docs = chunk_documents(docs)
    embedded_docs, embedding_model = get_embeddings(chunked_docs)
    print(f"Total embeddings created: {len(embedded_docs)}")
    if embedded_docs:
        print(f"Embedding vector size: {len(embedded_docs[0]['embedding'])}")

