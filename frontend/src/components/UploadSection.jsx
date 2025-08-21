import React, { useState, useRef } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import './UploadSection.css';

const UploadSection = ({ onUploadSuccess, onNotification }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      onNotification({
        type: 'error',
        message: 'Please select only PDF files'
      });
      return;
    }

    if (pdfFiles.length > 1) {
      onNotification({
        type: 'error',
        message: 'Please upload one PDF file at a time'
      });
      return;
    }

    handleFileUpload(pdfFiles[0]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      onNotification({
        type: 'error',
        message: 'Please select a PDF file'
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      onNotification({
        type: 'error',
        message: 'File size must be less than 50MB'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUploadSuccess(response);
          
          onNotification({
            type: 'success',
            message: 'PDF uploaded successfully! Processing will begin shortly.'
          });
        } else {
          throw new Error(`Upload failed with status: ${xhr.status}`);
        }
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        throw new Error('Upload failed');
      };

      xhr.open('POST', '/api/pdfs/upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      onNotification({
        type: 'error',
        message: 'Failed to upload PDF. Please try again.'
      });
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-section">
      <div
        className={`upload-dropzone ${isDragging ? 'upload-dropzone--dragging' : ''} ${isUploading ? 'upload-dropzone--uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="upload-progress">
            <div className="upload-progress__icon">📤</div>
            <h3>Uploading PDF...</h3>
            <div className="upload-progress__bar">
              <div 
                className="upload-progress__fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>{uploadProgress}% complete</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-content__icon">
              {isDragging ? '🎯' : '📄'}
            </div>
            <h3>
              {isDragging ? 'Drop your PDF here!' : 'Upload PDF Document'}
            </h3>
            <p>
              {isDragging 
                ? 'Release to upload your document' 
                : 'Drag and drop a PDF file here, or click to select'
              }
            </p>
            <div className="upload-content__specs">
              <span>• PDF files only</span>
              <span>• Max size: 50MB</span>
              <span>• Text extraction & OCR supported</span>
            </div>
          </div>
        )}
      </div>

      {!isUploading && (
        <div className="upload-actions">
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            icon="📁"
            fullWidth
          >
            Choose PDF File
          </Button>
        </div>
      )}

      <div className="upload-info">
        <Card variant="secondary">
          <h4>📋 What happens after upload?</h4>
          <ul>
            <li>🔍 Text extraction from your PDF</li>
            <li>🖼️ OCR for scanned documents</li>
            <li>🧠 AI processing and indexing</li>
            <li>💬 Ready for intelligent chat!</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default UploadSection;
