import logging
from rag.vectordb import get_vectorstore

logger = logging.getLogger(__name__)

def retrieve_documents(query, k=5, fetch_k=15, verbose=False):
    """
    Retrieve relevant documents using MMR (Maximal Marginal Relevance).
    Production-safe with detailed error logging.
    
    Args:
        query: Search query
        k: Number of documents to return (optimized for speed)
        fetch_k: Number of documents to fetch before MMR reranking
        verbose: If True, print retrieved sources
    
    Returns:
        List of retrieved documents
    """
    try:
        vectorstore = get_vectorstore()
        logger.info(f"Retrieving documents for query: '{query[:50]}...'")
    except Exception as e:
        logger.error(f"Failed to load vectorstore: {str(e)}", exc_info=True)
        raise
    
    try:
        # Use MMR for diversity
        results = vectorstore.max_marginal_relevance_search(
            query,
            k=k,
            fetch_k=fetch_k
        )
        logger.info(f"MMR search returned {len(results)} documents")
    except Exception as e:
        # Fallback to regular similarity search
        logger.warning(f"MMR search failed ({str(e)}), falling back to similarity search")
        try:
            results = vectorstore.similarity_search(query, k=k)
            logger.info(f"Similarity search returned {len(results)} documents")
        except Exception as e2:
            logger.error(f"Similarity search also failed: {str(e2)}", exc_info=True)
            raise
    
    if verbose and results:
        sources = [doc.metadata.get('source', 'unknown') for doc in results]
        print(f"\n[SEARCH] Retrieved {len(results)} documents from:")
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
