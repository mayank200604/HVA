import os
from langchain_community.vectorstores import Chroma
from rag.embeddings import get_embedding_model

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

# Global cache for vectorstore to avoid reloading on every request
_vectorstore_cache = None


def get_vectorstore():
    """
    Load an existing Chroma vector store with caching.
    This function DOES NOT create the DB.
    """
    global _vectorstore_cache
    
    # Return cached vectorstore if available
    if _vectorstore_cache is not None:
        return _vectorstore_cache

    if not os.path.exists(CHROMA_PATH):
        raise FileNotFoundError(
            f"Chroma DB not found at '{CHROMA_PATH}'. "
            "Run ingest.py first to create it."
        )

    embedding = get_embedding_model()

    vectorstore = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding
    )
    
    # Cache the vectorstore for future requests
    _vectorstore_cache = vectorstore

    return vectorstore


# ------------------------
# MAIN TEST
# ------------------------
if __name__ == "__main__":
    print("Loading vector store...")

    vectorstore = get_vectorstore()

    print("Vector store loaded successfully.")
    print(f"Number of vectors stored: {vectorstore._collection.count()}")
