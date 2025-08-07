import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models import db, PDF

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