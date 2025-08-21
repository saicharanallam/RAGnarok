import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorState from './ui/ErrorState';
import ChatInterface from './ChatInterface';
import UploadSection from './UploadSection';
import DocumentList from './DocumentList';
import './MainContent.css';

const MainContent = ({ onNotification }) => {
  const [documents, setDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDocumentListOpen, setIsDocumentListOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/pdfs');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.pdfs || []);
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError({
        title: 'Connection Error',
        message: 'Unable to load documents. Please check if the backend services are running.',
        type: 'network'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSuccess = (newDocument) => {
    setDocuments(prev => [newDocument, ...prev]);
    setIsUploadModalOpen(false);
    onNotification({
      type: 'success',
      message: 'Document uploaded successfully!'
    });
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      const response = await fetch(`/api/pdfs/${documentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        onNotification({
          type: 'success',
          message: 'Document deleted successfully'
        });
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      onNotification({
        type: 'error',
        message: 'Failed to delete document'
      });
    }
  };

  const getDocumentStats = () => {
    const total = documents.length;
    const processed = documents.filter(doc => doc.processing_status === 'completed' || doc.processed).length;
    const pending = documents.filter(doc => doc.processing_status === 'pending').length;
    const failed = documents.filter(doc => doc.processing_status === 'failed').length;
    
    return { total, processed, pending, failed };
  };

  const stats = getDocumentStats();

  return (
    <div className="main-content">
      {/* Quick Actions Bar */}
      <div className="main-content__actions">
        <div className="main-content__stats">
          {loading ? (
            <div className="stat-item stat-item--loading">
              <LoadingSpinner size="small" className="loading-spinner--inline" />
              <span className="stat-label">Loading stats...</span>
            </div>
          ) : error ? (
            <div className="stat-item stat-item--error">
              <span className="stat-number">⚠️</span>
              <span className="stat-label">Connection Error</span>
            </div>
          ) : (
            <>
              <div className="stat-item">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Documents</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.processed}</span>
                <span className="stat-label">Processed</span>
              </div>
              {stats.pending > 0 && (
                <div className="stat-item stat-item--warning">
                  <span className="stat-number">{stats.pending}</span>
                  <span className="stat-label">Pending</span>
                </div>
              )}
              {stats.failed > 0 && (
                <div className="stat-item stat-item--error">
                  <span className="stat-number">{stats.failed}</span>
                  <span className="stat-label">Failed</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="main-content__buttons">
          {error ? (
            <Button
              variant="outline"
              size="small"
              onClick={fetchDocuments}
              icon="🔄"
            >
              Retry Connection
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="small"
                onClick={() => setIsDocumentListOpen(true)}
                icon="📄"
                disabled={loading}
              >
                View Documents {!loading && `(${stats.total})`}
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => setIsUploadModalOpen(true)}
                icon="📤"
                disabled={loading}
              >
                Upload PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="main-content__chat">
        <ChatInterface 
          onNotification={onNotification}
          documentsAvailable={stats.processed > 0}
        />
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload PDF Document"
        size="medium"
      >
        <UploadSection
          onUploadSuccess={handleUploadSuccess}
          onNotification={onNotification}
        />
      </Modal>

      {/* Document List Modal */}
      <Modal
        isOpen={isDocumentListOpen}
        onClose={() => setIsDocumentListOpen(false)}
        title="Your Documents"
        size="large"
      >
        <DocumentList
          documents={documents}
          onDelete={handleDeleteDocument}
          onRefresh={fetchDocuments}
          loading={loading}
          onNotification={onNotification}
        />
      </Modal>
    </div>
  );
};

export default MainContent;
