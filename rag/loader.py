import os
from langchain_community.document_loaders import UnstructuredMarkdownLoader

RAG_DOCS_PATH = "rag_docs"

def load_md_files():
    documents = []
    for filename in os.listdir(RAG_DOCS_PATH):
        if filename.endswith(".md"):
            file_path = os.path.join(RAG_DOCS_PATH, filename)
            loader = UnstructuredMarkdownLoader(
                file_path,
                meta_data = {
                    "source": filename,
                    "doc_type": "markdown"
                })
            docs = loader.load()
            documents.extend(docs)
    return documents

docs = load_md_files()
print(f"Total documents loaded: {len(docs)}")
print(docs[0].page_content[:300])
print(docs[0].metadata)