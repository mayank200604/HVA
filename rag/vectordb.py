import os
from langchain_community.vectorstores import Chroma
try:
    from rag.chunker import chunk_documents
    from rag.loader import load_md_files
    from rag.embeddings import get_embeddings, get_embedding_model
except ImportError:
    from chunker import chunk_documents
    from loader import load_md_files
    from embeddings import get_embeddings, get_embedding_model

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")


def get_vectorstore():
    """
    Load an existing Chroma vector store.
    This function DOES NOT create the DB.
    """

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

    return vectorstore


# ------------------------
# MAIN TEST
# ------------------------
if __name__ == "__main__":
    print("Loading vector store...")

    vectorstore = get_vectorstore()

    print("Vector store loaded successfully.")
    print(f"Number of vectors stored: {vectorstore._collection.count()}")
