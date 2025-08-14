import os
import requests
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models import db, PDF
import json
from rag_service import RAGService

bp = Blueprint('api', __name__)

# Initialize RAG service
rag_service = RAGService()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

@bp.route('/api/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)  # Ensure folder exists
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # Create PDF record
        pdf = PDF(filename=filename, filepath=filepath)
        db.session.add(pdf)
        db.session.commit()
        
        # Process PDF through RAG pipeline
        try:
            success = rag_service.process_pdf(filepath, pdf.id, filename)
            if success:
                # Update PDF record to mark as processed
                pdf.processed = True
                # Get chunk count from vector DB
                chunks = rag_service.search_similar_chunks("", n_results=1000)  # Get all chunks for this PDF
                chunk_count = len([c for c in chunks if c['metadata']['pdf_id'] == pdf.id])
                pdf.chunk_count = chunk_count
                db.session.commit()
                
                return jsonify({
                    "status": "success", 
                    "filename": filename,
                    "processed": True,
                    "chunk_count": chunk_count
                }), 201
            else:
                # Mark as not processed but still uploaded
                pdf.processed = False
                db.session.commit()
                return jsonify({
                    "status": "success", 
                    "filename": filename,
                    "processed": False,
                    "warning": "File uploaded but text extraction failed"
                }), 201
        except Exception as e:
            # Mark as not processed but still uploaded
            pdf.processed = False
            db.session.commit()
            return jsonify({
                "status": "success", 
                "filename": filename,
                "processed": False,
                "warning": f"File uploaded but processing failed: {str(e)}"
            }), 201
    return jsonify({"error": "Invalid file type"}), 400

@bp.route('/api/pdfs', methods=['GET'])
def list_pdfs():
    pdfs = PDF.query.order_by(PDF.upload_time.desc()).all()
    return jsonify([
        {
            "id": pdf.id, 
            "filename": pdf.filename, 
            "uploaded": pdf.upload_time.isoformat(),
            "processed": pdf.processed,
            "chunk_count": pdf.chunk_count
        }
        for pdf in pdfs
    ])

@bp.route('/api/test', methods=['GET'])
def test_api():
    return {"message": "Backend is working!"}, 200

@bp.route('/api/llm', methods=['POST'])
def llm_interact():
    data = request.get_json()
    user_prompt = data.get('prompt', '')
    use_rag = data.get('use_rag', True)  # Default to using RAG
    
    # Get relevant context from uploaded documents
    context = ""
    sources_used = []
    
    if use_rag:
        try:
            relevant_chunks = rag_service.search_similar_chunks(user_prompt, n_results=5)
            if relevant_chunks:
                context_parts = []
                for chunk in relevant_chunks:
                    if chunk['similarity'] > 0.3:  # Only use chunks with decent similarity
                        context_parts.append(chunk['content'])
                        if chunk['metadata']['filename'] not in sources_used:
                            sources_used.append(chunk['metadata']['filename'])
                
                if context_parts:
                    context = "\n\n".join(context_parts)
        except Exception as e:
            print(f"RAG search error: {e}")
    
    # Construct the enhanced prompt
    if context:
        enhanced_prompt = f"""You are a helpful AI assistant. Use the following context from uploaded documents to answer the user's question. If the context doesn't contain relevant information, you can provide a general answer but mention that you're drawing from general knowledge rather than the uploaded documents.

Context from uploaded documents:
{context}

User question: {user_prompt}

Answer:"""
    else:
        enhanced_prompt = f"""You are a helpful AI assistant. The user has asked a question, but no relevant context was found in uploaded documents. Please provide a helpful answer based on your general knowledge, and mention that you're not drawing from any uploaded documents.

User question: {user_prompt}

Answer:"""
    
    ollama_url = "http://ollama:11434/api/generate"
    payload = {
        "model": "llama3",
        "prompt": enhanced_prompt
    }
    
    try:
        response = requests.post(ollama_url, json=payload, timeout=120, stream=True)
        response.raise_for_status()
        full_response = ""
        for line in response.iter_lines():
            if line:
                chunk = line.decode("utf-8")
                try:
                    obj = json.loads(chunk)
                    full_response += obj.get("response", "")
                except Exception:
                    pass
        
        return jsonify({
            "response": full_response,
            "sources_used": sources_used,
            "context_found": bool(context),
            "rag_enabled": use_rag
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/api/admin/flush', methods=['GET'])
def admin_flush():
    # WARNING: Protect this endpoint in production!
    try:
        # Delete all PDF files in the uploads folder
        uploads_folder = os.path.join(os.getcwd(), "uploads")
        if os.path.exists(uploads_folder):
            for filename in os.listdir(uploads_folder):
                file_path = os.path.join(uploads_folder, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        
        # Remove all PDF entries from the database
        from models import PDF, db
        PDF.query.delete()
        db.session.commit()
        
        # Clear the vector database
        rag_service.flush_all_documents()
        
        return jsonify({"status": "flushed", "message": "All PDFs, database entries, and vector embeddings cleared"})
    except Exception as e:
        return jsonify({"error": f"Flush failed: {str(e)}"}), 500

@bp.route('/api/admin/reprocess', methods=['POST'])
def admin_reprocess():
    """Reprocess all unprocessed PDFs."""
    try:
        unprocessed_pdfs = PDF.query.filter_by(processed=False).all()
        processed_count = 0
        failed_count = 0
        
        for pdf in unprocessed_pdfs:
            try:
                success = rag_service.process_pdf(pdf.filepath, pdf.id, pdf.filename)
                if success:
                    pdf.processed = True
                    # Get actual chunk count
                    chunks = rag_service.search_similar_chunks("", n_results=1000)
                    chunk_count = len([c for c in chunks if c['metadata']['pdf_id'] == pdf.id])
                    pdf.chunk_count = chunk_count
                    processed_count += 1
                else:
                    failed_count += 1
                db.session.commit()
            except Exception as e:
                print(f"Error reprocessing {pdf.filename}: {e}")
                failed_count += 1
        
        return jsonify({
            "status": "completed",
            "processed": processed_count,
            "failed": failed_count,
            "total_unprocessed": len(unprocessed_pdfs)
        })
    except Exception as e:
        return jsonify({"error": f"Reprocessing failed: {str(e)}"}), 500
