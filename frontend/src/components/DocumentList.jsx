import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import './DocumentList.css';

const DocumentList = ({ documents, onDelete, onRefresh, loading, onNotification }) => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch('/api/llm/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: searchQuery.trim(),
          use_rag: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      setSearchResults(results);
      
      if (results.length === 0) {
        onNotification('No relevant document chunks found for your search query.', 'info');
      } else {
        onNotification(`Found ${results.length} relevant document chunks!`, 'success');
      }
    } catch (error) {
      console.error('Search failed:', error);
      onNotification('Search failed. Please try again.', 'error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
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
        
        {/* Search Bar */}
        <div className="document-list__search">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document content..."
              className="search-input"
              disabled={isSearching}
            />
            <Button
              type="submit"
              variant="primary"
              size="small"
              disabled={!searchQuery.trim() || isSearching}
              loading={isSearching}
              icon="🔍"
            >
              Search
            </Button>
            {showSearchResults && (
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={clearSearch}
                icon="❌"
                title="Clear search"
              >
                Clear
              </Button>
            )}
          </form>
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
      
      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="document-list__search-results">
          <div className="search-results__header">
            <h3>🔍 Search Results for "{searchQuery}"</h3>
            <span className="search-results__count">
              {searchResults.length} chunks found
            </span>
          </div>
          <div className="search-results__list">
            {searchResults.map((result, index) => (
              <div key={index} className="search-result__item">
                <div className="search-result__content">
                  {result.content}
                </div>
                <div className="search-result__meta">
                  <span className="search-result__source">
                    📄 {result.source}
                  </span>
                  <span className="search-result__similarity">
                    🎯 {Math.round(result.similarity * 100)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
