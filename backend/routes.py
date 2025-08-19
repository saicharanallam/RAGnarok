import os
import requests
import threading
import time
import json
import psutil
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context
from werkzeug.utils import secure_filename
from flasgger import swag_from
from models import db, PDF, LLMInteraction, SystemMetrics, UserAnalytics
from rag_service import RAGService
from requests.exceptions import Timeout

bp = Blueprint("api", __name__)

# Initialize RAG service
rag_service = RAGService()


def track_system_metrics():
    """Track system performance metrics."""
    try:
        # Get current system metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Calculate queue metrics (simplified)
        processing_queue_size = PDF.query.filter_by(processing_status='pending').count()
        active_llm_requests = 0  # This would need more sophisticated tracking
        
        # Calculate averages from recent LLM interactions
        recent_interactions = LLMInteraction.query.filter(
            LLMInteraction.timestamp >= datetime.utcnow() - timedelta(hours=1)
        ).all()
        
        avg_response_time = None
        avg_processing_time = None
        error_rate = None
        
        if recent_interactions:
            response_times = [i.response_time for i in recent_interactions if i.response_time]
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)
            
            failed_requests = len([i for i in recent_interactions if not i.success])
            total_requests = len(recent_interactions)
            error_rate = (failed_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Store metrics
        metrics = SystemMetrics(
            cpu_usage=cpu_usage,
            memory_usage=memory.used / (1024 * 1024),  # MB
            disk_usage=disk.percent,
            processing_queue_size=processing_queue_size,
            active_llm_requests=active_llm_requests,
            avg_response_time=avg_response_time,
            avg_processing_time=avg_processing_time,
            error_rate=error_rate,
            failed_requests=len([i for i in recent_interactions if not i.success]),
            total_requests=len(recent_interactions)
        )
        db.session.add(metrics)
        db.session.commit()
        
    except Exception as e:
        print(f"Error tracking system metrics: {e}")


def process_pdf_background(pdf_id: int, filepath: str, filename: str):
    """Process PDF in background thread with analytics tracking."""
    from app import app
    
    with app.app_context():
        start_time = datetime.utcnow()
        file_size = None
        page_count = None
        text_length = None
        
        try:
            # Get fresh PDF object in this thread
            pdf = PDF.query.get(pdf_id)
            if not pdf:
                print(f"PDF {pdf_id} not found in background processing")
                return
            
            # Record start time and file size
            file_size = os.path.getsize(filepath) if os.path.exists(filepath) else None
            pdf.processing_start_time = start_time
            pdf.file_size = file_size
            pdf.processing_status = 'processing'
            db.session.commit()
            
            # Process the PDF with analytics
            success, extraction_method = rag_service.process_pdf(filepath, pdf_id, filename)
            
            # Get additional metrics from the PDF
            try:
                import PyPDF2
                with open(filepath, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    page_count = len(pdf_reader.pages)
            except Exception:
                page_count = None
            
            # Get fresh PDF object after processing
            pdf = PDF.query.get(pdf_id)
            if not pdf:
                print(f"PDF {pdf_id} disappeared during processing")
                return
            
            end_time = datetime.utcnow()
            processing_duration = (end_time - start_time).total_seconds()
            
            if success:
                # Get chunk count efficiently
                chunk_count = rag_service.count_chunks_for_pdf(pdf_id)
                
                # Calculate text length if available
                try:
                    extracted_text, _ = rag_service.extract_text_from_pdf_with_method(filepath)
                    text_length = len(extracted_text) if extracted_text else 0
                except Exception:
                    text_length = None
                
                # Update status to completed with analytics
                pdf.processed = True
                pdf.chunk_count = chunk_count
                pdf.processing_status = 'completed'
                pdf.processing_error = None
                pdf.extraction_method = extraction_method
                pdf.processing_end_time = end_time
                pdf.processing_duration = processing_duration
                pdf.page_count = page_count
                pdf.text_length = text_length
            else:
                # Mark as failed
                pdf.processed = False
                pdf.processing_status = 'failed'
                pdf.processing_error = f'Text extraction failed (method: {extraction_method})'
                pdf.processing_end_time = end_time
                pdf.processing_duration = processing_duration
                pdf.page_count = page_count
            
            db.session.commit()
            
            # Track system metrics after processing
            track_system_metrics()
            
        except Exception as e:
            # Mark as failed with error
            try:
                pdf = PDF.query.get(pdf_id)
                if pdf:
                    end_time = datetime.utcnow()
                    processing_duration = (end_time - start_time).total_seconds()
                    
                    pdf.processed = False
                    pdf.processing_status = 'failed'
                    pdf.processing_error = str(e)
                    pdf.processing_end_time = end_time
                    pdf.processing_duration = processing_duration
                    pdf.file_size = file_size
                    pdf.page_count = page_count
                    db.session.commit()
            except Exception as db_error:
                print(f"Failed to update PDF {pdf_id} status: {db_error}")
            print(f"Background processing error for PDF {pdf_id}: {e}")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() == "pdf"


@bp.route("/api/upload", methods=["POST"])
@swag_from({
    'tags': ['documents'],
    'summary': 'Upload a PDF document',
    'description': 'Upload a PDF file for processing and text extraction',
    'consumes': ['multipart/form-data'],
    'parameters': [{
        'name': 'file',
        'in': 'formData',
        'type': 'file',
        'required': True,
        'description': 'PDF file to upload (max 50MB)'
    }],
    'responses': {
        201: {
            'description': 'File uploaded successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'filename': {'type': 'string'},
                    'pdf_id': {'type': 'integer'},
                    'processing_status': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        },
        400: {'description': 'Bad request - invalid file or too large'},
        500: {'description': 'Internal server error'}
    }
})
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    # Check file size (limit to 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
    file.seek(0, 2)  # Seek to end of file
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)  # Ensure folder exists
        filepath = os.path.join(upload_folder, filename)
        
        try:
            file.save(filepath)
        except Exception as save_error:
            return jsonify({"error": f"Failed to save file: {str(save_error)}"}), 500

        # Create PDF record with pending status
        try:
            pdf = PDF(filename=filename, filepath=filepath, processing_status='pending')
            db.session.add(pdf)
            db.session.commit()
        except Exception as db_error:
            # Clean up saved file if database operation fails
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
            except OSError:
                pass  # File cleanup failed, but we can't do much about it
            return jsonify({"error": f"Database operation failed: {str(db_error)}"}), 500

        # Start background processing
        thread = threading.Thread(
            target=process_pdf_background,
            args=(pdf.id, filepath, filename),
            daemon=True
        )
        thread.start()
        
        # Add a small delay to ensure thread starts properly
        time.sleep(0.1)

        return (
            jsonify(
                {
                    "status": "success",
                    "filename": filename,
                    "pdf_id": pdf.id,
                    "processing_status": "pending",
                    "message": "File uploaded successfully. Processing started in background.",
                }
            ),
            201,
        )
    return jsonify({"error": "Invalid file type"}), 400


@bp.route("/api/pdfs", methods=["GET"])
@swag_from({
    'tags': ['documents'],
    'summary': 'List uploaded PDF documents',
    'description': 'Get a paginated list of uploaded PDF documents with their processing status',
    'parameters': [
        {
            'name': 'page',
            'in': 'query',
            'type': 'integer',
            'default': 1,
            'description': 'Page number for pagination'
        },
        {
            'name': 'per_page',
            'in': 'query', 
            'type': 'integer',
            'default': 20,
            'description': 'Number of items per page (max 100)'
        }
    ],
    'responses': {
        200: {
            'description': 'List of PDF documents',
            'schema': {
                'type': 'object',
                'properties': {
                    'pdfs': {
                        'type': 'array',
                        'items': {'$ref': '#/definitions/PDF'}
                    },
                    'pagination': {
                        'type': 'object',
                        'properties': {
                            'page': {'type': 'integer'},
                            'per_page': {'type': 'integer'},
                            'total': {'type': 'integer'},
                            'pages': {'type': 'integer'},
                            'has_next': {'type': 'boolean'},
                            'has_prev': {'type': 'boolean'}
                        }
                    }
                }
            }
        }
    }
})
def list_pdfs():
    # Add pagination support with validation
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Validate inputs
        if page < 1:
            page = 1
        if per_page < 1:
            per_page = 20
        
        # Limit per_page to prevent abuse
        per_page = min(per_page, 100)
        
    except (ValueError, TypeError):
        # Fallback to defaults if invalid input
        page = 1
        per_page = 20
    
    pdfs_paginated = PDF.query.order_by(PDF.upload_time.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "pdfs": [
            {
                "id": pdf.id,
                "filename": pdf.filename,
                "uploaded": pdf.upload_time.isoformat(),
                "processed": pdf.processed,
                "chunk_count": pdf.chunk_count,
                "processing_status": pdf.processing_status,
                "processing_error": pdf.processing_error,
                "extraction_method": pdf.extraction_method,
                "processing_duration": pdf.processing_duration,
                "file_size": pdf.file_size,
                "page_count": pdf.page_count,
                "text_length": pdf.text_length,
            }
            for pdf in pdfs_paginated.items
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": pdfs_paginated.total,
            "pages": pdfs_paginated.pages,
            "has_next": pdfs_paginated.has_next,
            "has_prev": pdfs_paginated.has_prev,
        }
    })


@bp.route("/api/pdfs/<int:pdf_id>/status", methods=["GET"])
def get_pdf_status(pdf_id):
    """Get processing status for a specific PDF."""
    pdf = PDF.query.get_or_404(pdf_id)
    return jsonify({
        "id": pdf.id,
        "filename": pdf.filename,
        "processing_status": pdf.processing_status,
        "processed": pdf.processed,
        "chunk_count": pdf.chunk_count,
        "processing_error": pdf.processing_error,
        "extraction_method": pdf.extraction_method,
        "uploaded": pdf.upload_time.isoformat(),
        "processing_duration": pdf.processing_duration,
        "file_size": pdf.file_size,
        "page_count": pdf.page_count,
        "text_length": pdf.text_length,
    })


@bp.route("/api/test", methods=["GET"])
def test_api():
    return {"message": "Backend is working!"}, 200


@bp.route('/api/llm', methods=['POST'])
def llm_interact():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        ollama_url = "http://ollama:11434/api/generate"
        payload = {
            "model": "llama3",
            "prompt": prompt,
            "stream": True,
            "timeout": 180  # 3 minutes timeout
        }

        def generate_stream():
            try:
                with requests.post(ollama_url, json=payload, stream=True, timeout=180) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': 'Error from LLM service'})}\n\n"
                        return

                    for line in response.iter_lines():
                        if line:
                            yield f"data: {line.decode('utf-8')}\n\n"
                            
            except Timeout:
                yield f"data: {json.dumps({'error': 'Request timed out'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(
            stream_with_context(generate_stream()),
            mimetype='text/event-stream'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route("/api/analytics/overview", methods=["GET"])
@swag_from({
    'tags': ['analytics'],
    'summary': 'Get analytics overview',
    'description': 'Get comprehensive analytics overview including PDF processing, LLM interactions, and system metrics',
    'responses': {
        200: {
            'description': 'Analytics overview',
            'schema': {'$ref': '#/definitions/AnalyticsOverview'}
        }
    }
})
def get_analytics_overview():
    """Get comprehensive analytics overview."""
    try:
        # PDF Statistics
        total_pdfs = PDF.query.count()
        processed_pdfs = PDF.query.filter_by(processed=True).count()
        pending_pdfs = PDF.query.filter_by(processing_status='pending').count()
        failed_pdfs = PDF.query.filter_by(processing_status='failed').count()
        
        # Average processing time
        processed_with_duration = PDF.query.filter(PDF.processing_duration.isnot(None)).all()
        avg_processing_time = None
        if processed_with_duration:
            avg_processing_time = sum(pdf.processing_duration for pdf in processed_with_duration) / len(processed_with_duration)
        
        total_chunks = sum(pdf.chunk_count or 0 for pdf in PDF.query.all())
        
        # LLM Statistics
        total_interactions = LLMInteraction.query.count()
        successful_interactions = LLMInteraction.query.filter_by(success=True).count()
        
        avg_response_time = None
        avg_prompt_length = None
        avg_response_length = None
        success_rate = None
        
        if total_interactions > 0:
            success_rate = (successful_interactions / total_interactions) * 100
            
            # Calculate averages for successful interactions
            interactions_with_time = LLMInteraction.query.filter(
                LLMInteraction.response_time.isnot(None)
            ).all()
            
            if interactions_with_time:
                avg_response_time = sum(i.response_time for i in interactions_with_time) / len(interactions_with_time)
            
            all_interactions = LLMInteraction.query.all()
            avg_prompt_length = sum(i.prompt_length for i in all_interactions) / len(all_interactions)
            
            interactions_with_response = [i for i in all_interactions if i.response_length]
            if interactions_with_response:
                avg_response_length = sum(i.response_length for i in interactions_with_response) / len(interactions_with_response)
        
        # System Statistics (from recent metrics)
        recent_metrics = SystemMetrics.query.filter(
            SystemMetrics.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).all()
        
        avg_cpu_usage = None
        avg_memory_usage = None 
        avg_disk_usage = None
        current_queue_size = pending_pdfs
        
        if recent_metrics:
            cpu_values = [m.cpu_usage for m in recent_metrics if m.cpu_usage is not None]
            memory_values = [m.memory_usage for m in recent_metrics if m.memory_usage is not None]
            disk_values = [m.disk_usage for m in recent_metrics if m.disk_usage is not None]
            
            if cpu_values:
                avg_cpu_usage = sum(cpu_values) / len(cpu_values)
            if memory_values:
                avg_memory_usage = sum(memory_values) / len(memory_values)
            if disk_values:
                avg_disk_usage = sum(disk_values) / len(disk_values)
        
        return jsonify({
            "pdf_stats": {
                "total_pdfs": total_pdfs,
                "processed_pdfs": processed_pdfs,
                "pending_pdfs": pending_pdfs,
                "failed_pdfs": failed_pdfs,
                "avg_processing_time": avg_processing_time,
                "total_chunks": total_chunks
            },
            "llm_stats": {
                "total_interactions": total_interactions,
                "avg_response_time": avg_response_time,
                "success_rate": success_rate,
                "avg_prompt_length": avg_prompt_length,
                "avg_response_length": avg_response_length
            },
            "system_stats": {
                "avg_cpu_usage": avg_cpu_usage,
                "avg_memory_usage": avg_memory_usage,
                "avg_disk_usage": avg_disk_usage,
                "current_queue_size": current_queue_size
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to get analytics: {str(e)}"}), 500


@bp.route("/api/analytics/pdf/<int:pdf_id>", methods=["GET"])
def get_pdf_analytics(pdf_id):
    """Get detailed analytics for a specific PDF."""
    pdf = PDF.query.get_or_404(pdf_id)
    
    return jsonify({
        "id": pdf.id,
        "filename": pdf.filename,
        "upload_time": pdf.upload_time.isoformat(),
        "processing_start_time": pdf.processing_start_time.isoformat() if pdf.processing_start_time else None,
        "processing_end_time": pdf.processing_end_time.isoformat() if pdf.processing_end_time else None,
        "processing_duration": pdf.processing_duration,
        "file_size": pdf.file_size,
        "page_count": pdf.page_count,
        "text_length": pdf.text_length,
        "chunk_count": pdf.chunk_count,
        "extraction_method": pdf.extraction_method,
        "processing_status": pdf.processing_status,
        "processing_error": pdf.processing_error
    })


@bp.route("/api/admin/flush", methods=["GET"])
@swag_from({
    'tags': ['admin'],
    'summary': 'Flush all data',
    'description': 'Delete all PDF files, database records, and vector embeddings. Use with caution!',
    'responses': {
        200: {
            'description': 'All data flushed successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'}
                }
            }
        },
        500: {'description': 'Flush operation failed'}
    }
})
def admin_flush():
    # WARNING: Protect this endpoint in production!
    try:
        # Delete all PDF files in the uploads folder
        uploads_folder = os.path.join(os.getcwd(), "uploads")
        deleted_files = 0
        if os.path.exists(uploads_folder):
            for filename in os.listdir(uploads_folder):
                try:
                    file_path = os.path.join(uploads_folder, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        deleted_files += 1
                except OSError as e:
                    print(f"Failed to delete file {filename}: {e}")
                    # Continue with other files

        # Remove all records from the database
        try:
            deleted_records = PDF.query.count()
            PDF.query.delete()
            LLMInteraction.query.delete()
            SystemMetrics.query.delete()
            UserAnalytics.query.delete()
            db.session.commit()
        except Exception as db_error:
            print(f"Database cleanup failed: {db_error}")
            return jsonify({"error": f"Database cleanup failed: {str(db_error)}"}), 500

        # Clear the vector database
        try:
            rag_service.flush_all_documents()
        except Exception as vector_error:
            print(f"Vector database cleanup failed: {vector_error}")
            return jsonify({"error": f"Vector database cleanup failed: {str(vector_error)}"}), 500

        return jsonify(
            {
                "status": "flushed",
                "message": f"All data cleared. Deleted {deleted_files} files and {deleted_records} database records.",
            }
        )
    except Exception as e:
        return jsonify({"error": f"Flush failed: {str(e)}"}), 500


@bp.route("/api/admin/reprocess", methods=["POST"])
def admin_reprocess():
    """Reprocess all unprocessed PDFs."""
    try:
        unprocessed_pdfs = PDF.query.filter_by(processed=False).all()
        processed_count = 0
        failed_count = 0

        for pdf in unprocessed_pdfs:
            try:
                success, extraction_method = rag_service.process_pdf(pdf.filepath, pdf.id, pdf.filename)
                if success:
                    pdf.processed = True
                    # Get actual chunk count efficiently
                    chunk_count = rag_service.count_chunks_for_pdf(pdf.id)
                    pdf.chunk_count = chunk_count
                    pdf.processing_status = 'completed'
                    pdf.extraction_method = extraction_method
                    processed_count += 1
                else:
                    pdf.processing_status = 'failed'
                    pdf.processing_error = f'Text extraction failed (method: {extraction_method})'
                    failed_count += 1
                db.session.commit()
            except Exception as e:
                print(f"Error reprocessing {pdf.filename}: {e}")
                failed_count += 1

        return jsonify(
            {
                "status": "completed",
                "processed": processed_count,
                "failed": failed_count,
                "total_unprocessed": len(unprocessed_pdfs),
            }
        )
    except Exception as e:
        return jsonify({"error": f"Reprocessing failed: {str(e)}"}), 500
