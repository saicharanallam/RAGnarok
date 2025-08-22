import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import './EnhancedDocumentCard.css';

const EnhancedDocumentCard = ({ document, onDelete, onQuery }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const parseTopics = (topicsString) => {
    try {
      return JSON.parse(topicsString || '[]');
    } catch {
      return [];
    }
  };

  const topics = parseTopics(document.key_topics);
  const isProcessed = document.processing_status === 'completed' || document.processed;

  return (
    <Card className={`enhanced-document-card ${isExpanded ? 'expanded' : ''}`} hoverable>
      <div className="enhanced-document-card__header">
        <div className="enhanced-document-card__title-section">
          <div className="enhanced-document-card__status">
            <span className={`status-badge status-badge--${getStatusColor(document.processing_status)}`}>
              {getStatusIcon(document.processing_status)}
              {document.processing_status || 'pending'}
            </span>
          </div>
          <h3 className="enhanced-document-card__title" title={document.filename}>
            📄 {document.filename}
          </h3>
        </div>
        
        <div className="enhanced-document-card__actions">
          <Button
            variant="ghost"
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            icon={isExpanded ? "⏶" : "⏷"}
            title={isExpanded ? "Collapse" : "Expand"}
          />
          <Button
            variant="ghost"
            size="small"
            onClick={() => onDelete(document.id)}
            icon="🗑️"
            title="Delete document"
          />
        </div>
      </div>

      {/* Summary Section */}
      {isProcessed && document.summary && (
        <div className="enhanced-document-card__summary">
          <p className="enhanced-document-card__summary-text">
            {document.summary}
          </p>
        </div>
      )}

      {/* Topics Section */}
      {isProcessed && topics.length > 0 && (
        <div className="enhanced-document-card__topics">
          {topics.map((topic, index) => (
            <span key={index} className="topic-tag">
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Stats Section */}
      <div className="enhanced-document-card__stats">
        <div className="stat-item">
          <span className="stat-icon">📊</span>
          <span className="stat-value">{formatFileSize(document.file_size || 0)}</span>
        </div>
        
        {document.page_count && (
          <div className="stat-item">
            <span className="stat-icon">📃</span>
            <span className="stat-value">{document.page_count} pages</span>
          </div>
        )}
        
        {document.chunks_count && (
          <div className="stat-item">
            <span className="stat-icon">🔗</span>
            <span className="stat-value">{document.chunks_count} chunks</span>
          </div>
        )}
        
        <div className="stat-item">
          <span className="stat-icon">📅</span>
          <span className="stat-value">{formatDate(document.upload_time)}</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="enhanced-document-card__expanded">
          {/* Content Preview */}
          {document.content_preview && (
            <div className="enhanced-document-card__preview">
              <h4>Content Preview</h4>
              <p className="preview-text">{document.content_preview}</p>
            </div>
          )}

          {/* Processing Details */}
          <div className="enhanced-document-card__details">
            <h4>Processing Details</h4>
            <div className="details-grid">
              {document.extraction_method && (
                <div className="detail-item">
                  <span className="detail-label">Extraction:</span>
                  <span className="detail-value">{document.extraction_method}</span>
                </div>
              )}
              
              {document.processing_duration && (
                <div className="detail-item">
                  <span className="detail-label">Processing Time:</span>
                  <span className="detail-value">{document.processing_duration.toFixed(2)}s</span>
                </div>
              )}
              
              {document.text_length && (
                <div className="detail-item">
                  <span className="detail-label">Text Length:</span>
                  <span className="detail-value">{document.text_length.toLocaleString()} chars</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {isProcessed && (
            <div className="enhanced-document-card__actions-expanded">
              <Button
                variant="primary"
                size="small"
                onClick={() => onQuery && onQuery(document)}
                icon="💬"
              >
                Ask Questions
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => {/* TODO: Implement document details view */}}
                icon="📖"
              >
                View Details
              </Button>
            </div>
          )}

          {/* Error Message */}
          {document.processing_status === 'failed' && document.processing_error && (
            <div className="enhanced-document-card__error">
              <h4>Processing Error</h4>
              <p>{document.processing_error}</p>
            </div>
          )}
        </div>
      )}

      {/* Processing Status for Non-Processed Documents */}
      {!isProcessed && (
        <div className="enhanced-document-card__processing">
          {document.processing_status === 'processing' && (
            <div className="processing-indicator">
              <div className="processing-spinner"></div>
              <span>Processing document...</span>
            </div>
          )}
          
          {document.processing_status === 'pending' && (
            <div className="pending-indicator">
              <span>⏳ Waiting to be processed...</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default EnhancedDocumentCard;
