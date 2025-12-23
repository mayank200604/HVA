from langchain_text_splitters import RecursiveCharacterTextSplitter
from loader import load_md_files

def chunk_documents(documents, chunk_size=1000, chunk_overlap=200):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    chunked_docs = []
    for doc in documents:
        chunks = text_splitter.split_text(doc.page_content)
        for i, chunk in enumerate(chunks):
            chunked_doc = doc.copy()
            chunked_doc.page_content = chunk
            chunked_doc.metadata["chunk_index"] = i
            chunked_docs.append(chunked_doc)
    return chunked_docs

docs = load_md_files()
chunked_docs = chunk_documents(docs)
print(f"Total chunks created: {len(chunked_docs)}")
print(chunked_docs[0].page_content)
print(chunked_docs[0].metadata)