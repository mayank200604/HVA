import os
import logging
from langchain_community.vectorstores import Chroma
from rag.embeddings import get_embedding_model

# Use absolute path for production reliability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

logger = logging.getLogger(__name__)

# Global cache for vectorstore to avoid reloading on every request
_vectorstore_cache = None


def get_vectorstore():
    """
    Load an existing Chroma vector store with caching.
    Production-safe with absolute paths and detailed error logging.
    """
    global _vectorstore_cache
    
    # Return cached vectorstore if available
    if _vectorstore_cache is not None:
        return _vectorstore_cache

    # Verify database exists
    if not os.path.exists(CHROMA_PATH):
        error_msg = (
            f"Chroma DB directory not found at absolute path: '{CHROMA_PATH}'. "
            f"Ensure 'app/rag/chroma_db' exists and contains the database files."
        )
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    # Check for the actual database file
    chroma_sqlite = os.path.join(CHROMA_PATH, "chroma.sqlite3")
    if not os.path.exists(chroma_sqlite):
        error_msg = (
            f"Chroma database file not found: '{chroma_sqlite}'. "
            f"Database directory exists but is empty or incomplete. "
            f"Ensure 'chroma.sqlite3' is committed to the repository."
        )
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    logger.info(f"Loading Chroma DB from: {CHROMA_PATH}")
    
    try:
        # Get embedding model (cached)
        embedding = get_embedding_model()
        logger.info("Embedding model loaded successfully")
        
        # Load vectorstore
        vectorstore = Chroma(
            persist_directory=CHROMA_PATH,
            embedding_function=embedding
        )
        
        # Verify it has content
        try:
            count = vectorstore._collection.count()
            logger.info(f"Vectorstore loaded successfully with {count} documents")
        except Exception as e:
            logger.warning(f"Could not verify document count: {e}")
        
        # Cache the vectorstore for future requests
        _vectorstore_cache = vectorstore
        
        return vectorstore
        
    except Exception as e:
        error_msg = f"Failed to load Chroma vectorstore: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from e


# ------------------------
# MAIN TEST
# ------------------------
if __name__ == "__main__":
    print("Loading vector store...")

    vectorstore = get_vectorstore()

    print("Vector store loaded successfully.")
    print(f"Number of vectors stored: {vectorstore._collection.count()}")

