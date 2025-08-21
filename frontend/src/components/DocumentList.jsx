import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import './DocumentList.css';

const DocumentList = ({ documents, onDelete, onRefresh, loading, onNotification }) => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '📄';
    }
  };

  const handleDeleteClick = (document) => {
    setDeleteModal({ isOpen: true, document });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.document) {
      await onDelete(deleteModal.document.id);
      setDeleteModal({ isOpen: false, document: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, document: null });
  };

  if (loading) {
    return (
      <div className="document-list__loading">
        <div className="spinner"></div>
        <p>Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="document-list__empty">
        <div className="document-list__empty-icon">📄</div>
        <h3>No documents uploaded yet</h3>
        <p>Upload your first PDF document to get started with RAGnarok!</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="document-list__header">
        <div className="document-list__stats">
          <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        </div>
        <Button
          variant="ghost"
          size="small"
          onClick={onRefresh}
          icon="🔄"
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="document-list__grid">
        {documents.map((document) => (
          <Card
            key={document.id}
            className="document-card"
            hoverable
          >
            <div className="document-card__header">
              <div className="document-card__status">
                <span className={`status-badge status-badge--${getStatusColor(document.processing_status)}`}>
                  {getStatusIcon(document.processing_status)}
                  {document.processing_status || 'pending'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleDeleteClick(document)}
                icon="🗑️"
                title="Delete document"
              />
            </div>

            <div className="document-card__content">
              <h4 className="document-card__title" title={document.filename}>
                {document.filename}
              </h4>
              
              <div className="document-card__meta">
                <div className="document-card__meta-item">
                  <span className="document-card__meta-label">Size:</span>
                  <span className="document-card__meta-value">
                    {formatFileSize(document.file_size)}
                  </span>
                </div>
                
                <div className="document-card__meta-item">
                  <span className="document-card__meta-label">Uploaded:</span>
                  <span className="document-card__meta-value">
                    {formatDate(document.upload_date)}
                  </span>
                </div>

                {(document.processing_status === 'completed' || document.processed) && (
                  <>
                    {document.chunks_count && (
                      <div className="document-card__meta-item">
                        <span className="document-card__meta-label">Text Chunks:</span>
                        <span className="document-card__meta-value">
                          {document.chunks_count}
                        </span>
                      </div>
                    )}
                    {document.page_count && (
                      <div className="document-card__meta-item">
                        <span className="document-card__meta-label">Pages:</span>
                        <span className="document-card__meta-value">
                          {document.page_count}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {document.processing_status === 'failed' && document.error_message && (
                <div className="document-card__error">
                  <strong>Error:</strong> {document.error_message}
                </div>
              )}

              {document.processing_status === 'processing' && (
                <div className="document-card__processing">
                  <div className="processing-spinner"></div>
                  <span>Processing document...</span>
                </div>
              )}

              {(document.processing_status === 'completed' || document.processed) && (
                <div className="document-card__summary">
                  <div className="document-card__summary-header">
                    <span className="document-card__summary-icon">📄</span>
                    <span className="document-card__summary-title">Document Ready</span>
                  </div>
                  <p className="document-card__summary-text">
                    This document has been processed and is ready for AI chat. 
                    {document.chunks_count && ` Split into ${document.chunks_count} searchable chunks.`}
                    {document.page_count && ` Contains ${document.page_count} pages.`}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        title="Delete Document"
        size="small"
      >
        <div className="delete-modal">
          <p>
            Are you sure you want to delete <strong>{deleteModal.document?.filename}</strong>?
          </p>
          <p className="delete-modal__warning">
            This action cannot be undone. All processed data and embeddings will be removed.
          </p>
          
          <div className="delete-modal__actions">
            <Button
              variant="ghost"
              onClick={handleDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              icon="🗑️"
            >
              Delete Document
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentList;
