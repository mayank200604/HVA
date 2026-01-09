from rag.vectordb import get_vectorstore

def retrieve_documents(query, k=5, fetch_k=15, verbose=False):
    """
    Retrieve relevant documents using MMR (Maximal Marginal Relevance).
    
    Args:
        query: Search query
        k: Number of documents to return (optimized for speed)
        fetch_k: Number of documents to fetch before MMR reranking
        verbose: If True, print retrieved sources
    
    Returns:
        List of retrieved documents
    """
    vectorstore = get_vectorstore()
    
    try:
        # Use MMR for diversity
        results = vectorstore.max_marginal_relevance_search(
            query,
            k=k,
            fetch_k=fetch_k
        )
    except Exception as e:
        # Fallback to regular similarity search
        if verbose:
            print(f"MMR failed ({e}), using similarity search")
        results = vectorstore.similarity_search(query, k=k)
    
    if verbose and results:
        sources = [doc.metadata.get('source', 'unknown') for doc in results]
        print(f"\n🔍 Retrieved {len(results)} documents from:")
        for source in set(sources):
            count = sources.count(source)
            print(f"  - {source} ({count} chunks)")
    
    return results


if __name__ == "__main__":
    query = "What framework should a student use before choosing a career?"
    docs = retrieve_documents(query, verbose=True)
    print(f"\nRetrieved {len(docs)} documents for query: '{query}'")
    for i, doc in enumerate(docs):
        print(f"\nDocument {i+1}:")
        print("Source:", doc.metadata.get("source"))
        print(doc.page_content[:200] + "...")