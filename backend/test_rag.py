#!/usr/bin/env python3
"""
Test script for RAG functionality.
Run this after the system is up to test the RAG pipeline.
"""

import os
import requests
import json
from app import app
from models import db, PDF
from rag_service import RAGService

def test_rag_pipeline():
    """Test the RAG pipeline components."""
    print("🔥 Testing RAGnarok RAG Pipeline 🔥")
    print("=" * 50)
    
    with app.app_context():
        rag_service = RAGService()
        
        # Test 1: Check if there are existing PDFs to process
        pdfs = PDF.query.all()
        print(f"📄 Found {len(pdfs)} PDFs in database")
        
        # Test 2: Process any unprocessed PDFs
        unprocessed = [pdf for pdf in pdfs if not pdf.processed]
        print(f"⚠️  {len(unprocessed)} PDFs need processing")
        
        for pdf in unprocessed[:3]:  # Process max 3 for testing
            print(f"🔄 Processing {pdf.filename}...")
            try:
                success = rag_service.process_pdf(pdf.filepath, pdf.id, pdf.filename)
                if success:
                    pdf.processed = True
                    pdf.chunk_count = len(rag_service.search_similar_chunks("", n_results=1000))
                    db.session.commit()
                    print(f"✅ Successfully processed {pdf.filename}")
                else:
                    print(f"❌ Failed to process {pdf.filename}")
            except Exception as e:
                print(f"❌ Error processing {pdf.filename}: {e}")
        
        # Test 3: Test vector search
        test_queries = [
            "What is this document about?",
            "Tell me about Python",
            "What are the main topics?"
        ]
        
        print("\n🔍 Testing Vector Search:")
        for query in test_queries:
            results = rag_service.search_similar_chunks(query, n_results=3)
            print(f"Query: '{query}' -> Found {len(results)} relevant chunks")
            if results:
                best_match = results[0]
                print(f"   Best match (similarity: {best_match['similarity']:.3f}): {best_match['content'][:100]}...")
        
        print("\n✅ RAG Pipeline Test Complete!")

def test_api_endpoints():
    """Test the API endpoints."""
    print("\n🌐 Testing API Endpoints:")
    base_url = "http://localhost:5000"
    
    # Test the basic endpoint
    try:
        response = requests.get(f"{base_url}/api/test", timeout=5)
        print(f"✅ Test endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Test endpoint failed: {e}")
    
    # Test PDF listing
    try:
        response = requests.get(f"{base_url}/api/pdfs", timeout=5)
        if response.status_code == 200:
            pdfs = response.json()
            print(f"✅ PDF listing: Found {len(pdfs)} PDFs")
            for pdf in pdfs[:3]:
                status = "✅ Processed" if pdf['processed'] else "⚠️ Not processed"
                print(f"   - {pdf['filename']}: {status}")
        else:
            print(f"❌ PDF listing failed: {response.status_code}")
    except Exception as e:
        print(f"❌ PDF listing failed: {e}")
    
    # Test LLM endpoint with a simple query
    try:
        response = requests.post(
            f"{base_url}/api/llm",
            json={"prompt": "Hello, what can you tell me from the uploaded documents?"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ LLM endpoint working")
            print(f"   Context found: {data.get('context_found', False)}")
            print(f"   Sources used: {data.get('sources_used', [])}")
            print(f"   Response preview: {data.get('response', '')[:100]}...")
        else:
            print(f"❌ LLM endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ LLM endpoint failed: {e}")

if __name__ == "__main__":
    print("Starting RAG tests...")
    test_rag_pipeline()
    test_api_endpoints()
    print("\n🎉 All tests completed!")
