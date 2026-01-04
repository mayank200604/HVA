from loader import load_md_files
from chunker import chunk_documents
from embeddings import get_embedding_model
from langchain_community.vectorstores import Chroma

CHROMA_PATH = "chroma_db"


def ingest():
    docs = load_md_files()
    chunks = chunk_documents(docs)
    embedding = get_embedding_model()

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding,
        persist_directory=CHROMA_PATH
    )

    vectorstore.persist()
    print(f"Ingested {len(chunks)} chunks into ChromaDB")


if __name__ == "__main__":
    ingest()
    print("Ingestion complete.")