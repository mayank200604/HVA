import os
import hashlib
from collections import Counter
from loader import load_md_files
from chunker import chunk_documents
from embeddings import get_embedding_model
from langchain_community.vectorstores import Chroma

CHROMA_PATH = "chroma_db"


def generate_chunk_id(chunk_content: str, source: str, chunk_index: int) -> str:
    """Generate deterministic hash-based ID for each chunk"""
    unique_string = f"{source}::{chunk_index}::{chunk_content[:100]}"
    return hashlib.md5(unique_string.encode()).hexdigest()


def ingest(reset_collection: bool = False):
    """
    Ingest documents into ChromaDB with proper deduplication and verification.
    
    Args:
        reset_collection: If True, deletes existing collection and starts fresh
    """
    print("="*60)
    print("STARTING RAG INGESTION")
    print("="*60)
    
    # Step 1: Load documents
    print("\n[1/5] Loading documents...")
    docs = load_md_files()
    print(f"[OK] Loaded {len(docs)} documents")
    
    # Step 2: Chunk documents
    print("\n[2/5] Chunking documents...")
    chunks = chunk_documents(docs)
    print(f"[OK] Created {len(chunks)} chunks")
    
    # Show chunks per source
    chunk_sources = [c.metadata.get('source', 'unknown') for c in chunks]
    source_counts = Counter(chunk_sources)
    print("\nChunks per document:")
    for source, count in sorted(source_counts.items()):
        print(f"  {source:40s} {count:3d} chunks")
    
    # Step 3: Generate unique IDs for each chunk
    print("\n[3/5] Generating chunk IDs...")
    chunk_ids = []
    for chunk in chunks:
        chunk_id = generate_chunk_id(
            chunk.page_content,
            chunk.metadata.get('source', 'unknown'),
            chunk.metadata.get('chunk_index', 0)
        )
        chunk_ids.append(chunk_id)
    print(f"✓ Generated {len(chunk_ids)} unique IDs")
    print(f"✓ Unique IDs: {len(set(chunk_ids))} (should match chunk count)")
    
    # Step 4: Reset collection if requested
    if reset_collection and os.path.exists(CHROMA_PATH):
        print("\n[4/5] Resetting collection...")
        import shutil
        shutil.rmtree(CHROMA_PATH)
        print("✓ Deleted existing ChromaDB")
    else:
        print("\n[4/5] Using existing collection (will upsert)...")
    
    # Step 5: Create/update vector store
    print("\n[5/5] Embedding and storing chunks...")
    embedding = get_embedding_model()
    
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding,
        persist_directory=CHROMA_PATH,
        ids=chunk_ids  # Use deterministic IDs
    )
    
    # Verify ingestion
    final_count = vectorstore._collection.count()
    print(f"\n[OK] Ingestion complete!")
    print(f"[OK] Total vectors in database: {final_count}")
    
    # Verify all sources are present
    all_docs = vectorstore.get()
    if all_docs and 'metadatas' in all_docs:
        db_sources = [meta.get('source', 'unknown') for meta in all_docs['metadatas']]
        db_source_counts = Counter(db_sources)
        print(f"\nVectors per document in database:")
        for source, count in sorted(db_source_counts.items()):
            print(f"  {source:40s} {count:3d} vectors")
        
        # Check if all sources made it
        loaded_sources = set(source_counts.keys())
        db_sources_set = set(db_source_counts.keys())
        missing = loaded_sources - db_sources_set
        
        if missing:
            print(f"\n[WARNING] {len(missing)} documents missing from database!")
            for source in sorted(missing):
                print(f"  - {source}")
        else:
            print(f"\n[OK] All {len(loaded_sources)} documents successfully embedded!")
    
    print("\n" + "="*60)
    print("INGESTION COMPLETE")
    print("="*60)
    
    return vectorstore


if __name__ == "__main__":
    # Use reset_collection=True to start fresh (recommended after adding new files)
    ingest(reset_collection=True)
    print("\n[OK] Run with reset_collection=False to update existing database")