try:
    from rag.vectordb import get_vectorstore
except ImportError:
    from vectordb import get_vectorstore

def retrieve_documents(query, k=3):
    vectorstore = get_vectorstore()
    results = vectorstore.max_marginal_relevance_search(
    query,
    k=5,
    fetch_k=15
)


    return results

if __name__ == "__main__":
    query = "What framework should a student use before choosing a career?"
    docs = retrieve_documents(query)
    print(f"Retrieved {len(docs)} documents for query: '{query}'")
    for i, doc in enumerate(docs):
        print(f"\nDocument {i+1}:")
        print("Source:", doc.metadata.get("source"))
        print(doc.page_content[:200] + "...")