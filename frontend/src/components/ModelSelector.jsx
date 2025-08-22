import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import Modal from './ui/Modal';
import apiConfig from '../config/api';
import './ModelSelector.css';

const ModelSelector = ({ onNotification }) => {
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModels();
    fetchCurrentModel();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await apiConfig.get('api/admin/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      } else {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setError('Failed to load available models');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentModel = async () => {
    try {
      const response = await apiConfig.get('api/admin/models/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentModel(data.current_model);
      }
    } catch (error) {
      console.error('Failed to fetch current model:', error);
    }
  };

  const handleDownloadModel = async () => {
    if (!newModelName.trim()) return;

    try {
      setDownloading(true);
      const response = await apiConfig.post('api/admin/models/download', {
        model_name: newModelName.trim()
      });

      if (response.ok) {
        const data = await response.json();
        onNotification({
          type: 'success',
          message: data.message
        });
        setShowDownloadModal(false);
        setNewModelName('');
        // Refresh models after a delay to allow download to complete
        setTimeout(() => fetchModels(), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to download model');
      }
    } catch (error) {
      onNotification({
        type: 'error',
        message: `Failed to download model: ${error.message}`
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleRemoveModel = async (modelName) => {
    if (modelName === currentModel) {
      onNotification({
        type: 'error',
        message: 'Cannot remove the currently active model'
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove model "${modelName}"?`)) {
      return;
    }

    try {
      const response = await apiConfig.delete(`api/admin/models/${modelName}`);
      if (response.ok) {
        onNotification({
          type: 'success',
          message: `Model "${modelName}" removed successfully`
        });
        fetchModels();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to remove model');
      }
    } catch (error) {
      onNotification({
        type: 'error',
        message: `Failed to remove model: ${error.message}`
      });
    }
  };

  const formatModelSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="model-selector">
        <div className="model-selector__loading">
          <LoadingSpinner size="large" message="Loading models..." />
        </div>
      </Card>
    );
  }

  return (
    <div className="model-selector">
      <Card className="model-selector__header">
        <div className="model-selector__title">
          <h2>🤖 LLM Model Management</h2>
          <div className="model-selector__current">
            <span className="model-selector__label">Current Model:</span>
            <span className="model-selector__current-model">{currentModel}</span>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowDownloadModal(true)}
          icon="📥"
        >
          Download New Model
        </Button>
      </Card>

      {error && (
        <Card className="model-selector__error">
          <p>❌ {error}</p>
          <Button variant="outline" onClick={fetchModels}>
            Retry
          </Button>
        </Card>
      )}

      <Card className="model-selector__models">
        <h3>Available Models ({models.length})</h3>
        {models.length === 0 ? (
          <div className="model-selector__empty">
            <p>No models found. Download your first model to get started!</p>
          </div>
        ) : (
          <div className="model-selector__list">
            {models.map((model) => (
              <div
                key={model.name}
                className={`model-selector__item ${
                  model.name === currentModel ? 'model-selector__item--current' : ''
                }`}
              >
                <div className="model-selector__item-info">
                  <div className="model-selector__item-name">
                    {model.name}
                    {model.name === currentModel && (
                      <span className="model-selector__item-badge">Active</span>
                    )}
                  </div>
                  <div className="model-selector__item-details">
                    <span className="model-selector__item-size">
                      {formatModelSize(model.size)}
                    </span>
                    <span className="model-selector__item-date">
                      Modified: {formatDate(model.modified_at)}
                    </span>
                  </div>
                </div>
                <div className="model-selector__item-actions">
                  {model.name !== currentModel && (
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleRemoveModel(model.name)}
                      icon="🗑️"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Download New Model"
        size="medium"
      >
        <div className="download-modal">
          <p>Enter the name of the model you want to download:</p>
          <div className="download-modal__input">
            <input
              type="text"
              placeholder="e.g., llama3.2:70b, mistral:7b"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDownloadModel()}
            />
          </div>
          <div className="download-modal__examples">
            <h4>Popular Models:</h4>
            <ul>
              <li><code>llama3.2:8b</code> - Good balance (current)</li>
              <li><code>llama3.2:70b</code> - High quality, slower</li>
              <li><code>mistral:7b</code> - Alternative model</li>
              <li><code>codellama:7b</code> - Code-focused</li>
            </ul>
          </div>
          <div className="download-modal__actions">
            <Button
              variant="ghost"
              onClick={() => setShowDownloadModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadModel}
              disabled={!newModelName.trim() || downloading}
              icon={downloading ? "⏳" : "📥"}
            >
              {downloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModelSelector;
