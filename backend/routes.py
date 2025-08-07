import os
import requests
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models import db, PDF
import json

bp = Blueprint('api', __name__)

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
        pdf = PDF(filename=filename, filepath=filepath)
        db.session.add(pdf)
        db.session.commit()
        return jsonify({"status": "success", "filename": filename}), 201
    return jsonify({"error": "Invalid file type"}), 400

@bp.route('/api/pdfs', methods=['GET'])
def list_pdfs():
    pdfs = PDF.query.order_by(PDF.upload_time.desc()).all()
    return jsonify([
        {"id": pdf.id, "filename": pdf.filename, "uploaded": pdf.upload_time.isoformat()}
        for pdf in pdfs
    ])

@bp.route('/api/test', methods=['GET'])
def test_api():
    return {"message": "Backend is working!"}, 200

@bp.route('/api/llm', methods=['POST'])
def llm_interact():
    data = request.get_json()
    prompt = data.get('prompt', '')
    ollama_url = "http://ollama:11434/api/generate"
    payload = {
        "model": "llama3",
        "prompt": prompt
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
        return jsonify({"response": full_response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/api/admin/flush', methods=['GET'])
def admin_flush():
    # WARNING: Protect this endpoint in production!
    # Delete all PDF files in the uploads folder
    uploads_folder = os.path.join(os.getcwd(), "uploads")
    for filename in os.listdir(uploads_folder):
        file_path = os.path.join(uploads_folder, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
    # Remove all PDF entries from the database
    from models import PDF, db
    PDF.query.delete()
    db.session.commit()
    return jsonify({"status": "flushed"})