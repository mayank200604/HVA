from langchain_community.embeddings import HuggingFaceEmbeddings
from loader import load_md_files
from chunker import chunk_documents

# Load and chunk documents
docs = load_md_files()
chunked_docs = chunk_documents(docs)

def get_embeddings(chunked_docs):
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    embedded_docs = []
    for doc in chunked_docs:
        embedding = embedding_model.embed_query(doc.page_content)
        embedded_docs.append({
            "content": doc.page_content,
            "metadata": doc.metadata,
            "embedding": embedding
        })
    return embedded_docs, embedding_model

embedded_docs, embedding_model = get_embeddings(chunked_docs)
print(f"Total embeddings created: {len(embedded_docs)}")
print(f"Embedding vector size: {len(embedded_docs[0]['embedding'])}")
