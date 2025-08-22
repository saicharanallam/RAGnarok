import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorState from './ui/ErrorState';
import ChatInterface from './ChatInterface';
import UploadSection from './UploadSection';
import EnhancedDocumentCard from './EnhancedDocumentCard';
import AdminPanel from './AdminPanel';
import apiConfig from '../config/api';
import './MainContent.css';
import './TabStyles.css';

const MainContent = ({ onNotification }) => {
  const [documents, setDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'documents', 'analytics'

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiConfig.get('api/pdfs');
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
      const response = await apiConfig.delete(`api/pdfs/${documentId}`);
      
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleQueryDocument = (document) => {
    setActiveTab('chat');
    // TODO: Pre-fill chat with document-specific context
  };

  return (
    <div className="main-content">
      {/* Tab Navigation */}
      <div className="main-content__tabs">
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => handleTabChange('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => handleTabChange('documents')}
        >
          📄 Documents ({stats.total})
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="main-content__tab-content">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="tab-content chat-tab">
            <div className="chat-tab__header">
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
                      <span className="stat-label">Ready for Chat</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="chat-tab__actions">
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setIsUploadModalOpen(true)}
                  icon="📤"
                  disabled={loading}
                >
                  Upload PDF
                </Button>
              </div>
            </div>
            
            <div className="chat-tab__interface">
              <ChatInterface 
                onNotification={onNotification}
                documentsAvailable={stats.processed > 0}
              />
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="tab-content documents-tab">
            <div className="documents-tab__header">
              <h2>Your Documents</h2>
              <div className="documents-tab__actions">
                <Button
                  variant="outline"
                  size="small"
                  onClick={fetchDocuments}
                  icon="🔄"
                  disabled={loading}
                >
                  Refresh
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
              </div>
            </div>

            {loading && <LoadingSpinner />}
            
            {error && (
              <ErrorState
                title={error.title}
                message={error.message}
                type={error.type}
                onRetry={fetchDocuments}
              />
            )}

            {!loading && !error && (
              <div className="documents-tab__list">
                {documents.length === 0 ? (
                  <div className="documents-empty">
                    <div className="documents-empty__icon">📄</div>
                    <h3>No documents uploaded yet</h3>
                    <p>Upload your first PDF document to get started with RAGnarok!</p>
                    <Button
                      variant="primary"
                      onClick={() => setIsUploadModalOpen(true)}
                      icon="📤"
                    >
                      Upload PDF
                    </Button>
                  </div>
                ) : (
                  documents.map((document) => (
                    <EnhancedDocumentCard
                      key={document.id}
                      document={document}
                      onDelete={handleDeleteDocument}
                      onQuery={handleQueryDocument}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="tab-content analytics-tab">
            <AdminPanel onNotification={onNotification} />
          </div>
        )}
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
    </div>
  );
};

export default MainContent;
