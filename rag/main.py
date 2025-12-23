from loader import load_md_files
from chunker import chunk_documents
from embeddings import get_embeddings
from vectordb import create_vectorstore


def ingest():
    docs = load_md_files()
    chunked_docs = chunk_documents(docs)
    embedded_docs, embedding_model = get_embeddings(chunked_docs)
    vectorstore = create_vectorstore(
        embedded_docs,
        embedding_model=embedding_model
    )
    print("Ingestion complete.")
    print(f"Ingested {len(embedded_docs)} chunks into ChromaDB")


if __name__ == "__main__":
    ingest()