from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from chunker import chunk_documents
from loader import load_md_files
from embeddings import get_embeddings

CHROMA_PATH = "chroma_db"

def create_vectorstore(embedded_docs, embedding_model):
    texts = [doc["content"] for doc in embedded_docs]
    metadatas = [doc["metadata"] for doc in embedded_docs]
    
    vectorstore = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding_model
    )
    
    vectorstore.add_texts(texts, metadatas=metadatas)
    vectorstore.persist()
    return vectorstore

docs = load_md_files()
chunked_docs = chunk_documents(docs)
embedded_docs, embedding_model = get_embeddings(chunked_docs)
vectorstore = create_vectorstore(embedded_docs, embedding_model)
print("Vectorstore created and persisted.")
