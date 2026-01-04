from langchain_community.embeddings import HuggingFaceEmbeddings
try:
    from rag.loader import load_md_files
    from rag.chunker import chunk_documents
except ImportError:
    from loader import load_md_files
    from chunker import chunk_documents

def get_embedding_model():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

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
    docs = load_md_files()
    chunked_docs = chunk_documents(docs)
    embedded_docs, embedding_model = get_embeddings(chunked_docs)
    print(f"Total embeddings created: {len(embedded_docs)}")
    if embedded_docs:
        print(f"Embedding vector size: {len(embedded_docs[0]['embedding'])}")
