import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorState from './ui/ErrorState';
import './AdminPanel.css';

const AdminPanel = ({ onNotification }) => {
  const [analytics, setAnalytics] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [llmInteractions, setLlmInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flushModal, setFlushModal] = useState({ isOpen: false, type: '' });

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/system');
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data.metrics);
      } else {
        throw new Error(`System metrics API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      throw error;
    }
  };

  const fetchLlmInteractions = async () => {
    try {
      const response = await fetch('/api/analytics/llm-interactions');
      if (response.ok) {
        const data = await response.json();
        setLlmInteractions(data.interactions || []);
      } else {
        throw new Error(`LLM interactions API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch LLM interactions:', error);
      throw error;
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchAnalytics(),
        fetchSystemMetrics(),
        fetchLlmInteractions()
      ]);
    } catch (error) {
      setError({
        title: 'Failed to Load Analytics',
        message: 'Unable to connect to the analytics API. Please check if the backend services are running.',
        type: 'network'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleFlushData = async (type) => {
    try {
      const response = await fetch(`/api/admin/flush/${type}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onNotification({
          type: 'success',
          message: `${type} data flushed successfully`
        });
        await fetchAllData();
      } else {
        throw new Error(`Failed to flush ${type} data`);
      }
    } catch (error) {
      onNotification({
        type: 'error',
        message: `Failed to flush ${type} data`
      });
    }
    setFlushModal({ isOpen: false, type: '' });
  };

  const formatBytes = (bytes) => {
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

  if (loading) {
    return (
      <div className="admin-panel">
        <LoadingSpinner 
          size="large" 
          message="Loading analytics data..." 
          className="loading-spinner--card"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel">
        <ErrorState
          title={error.title}
          message={error.message}
          icon="📊"
          onRetry={fetchAllData}
          className={`error-state--${error.type}`}
        />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h1>📊 RAGnarok Analytics</h1>
        <Button
          variant="ghost"
          size="small"
          onClick={fetchAllData}
          icon="🔄"
          disabled={loading}
        >
          Refresh Data
        </Button>
      </div>

      {/* System Overview */}
      <div className="admin-section">
        <h2>🖥️ System Overview</h2>
        <div className="metrics-grid">
          {!analytics ? (
            <>
              <Card className="metric-card metric-card--loading">
                <LoadingSpinner size="small" className="loading-spinner--inline" />
              </Card>
              <Card className="metric-card metric-card--loading">
                <LoadingSpinner size="small" className="loading-spinner--inline" />
              </Card>
              <Card className="metric-card metric-card--loading">
                <LoadingSpinner size="small" className="loading-spinner--inline" />
              </Card>
              <Card className="metric-card metric-card--loading">
                <LoadingSpinner size="small" className="loading-spinner--inline" />
              </Card>
            </>
          ) : (
            <>
              <Card className="metric-card">
                <div className="metric-card__content">
                  <div className="metric-card__icon">📄</div>
                  <div className="metric-card__data">
                    <div className="metric-card__value">{analytics.total_pdfs || 0}</div>
                    <div className="metric-card__label">Total PDFs</div>
                  </div>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="metric-card__content">
                  <div className="metric-card__icon">✅</div>
                  <div className="metric-card__data">
                    <div className="metric-card__value">{analytics.processed_pdfs || 0}</div>
                    <div className="metric-card__label">Processed</div>
                  </div>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="metric-card__content">
                  <div className="metric-card__icon">💬</div>
                  <div className="metric-card__data">
                    <div className="metric-card__value">{analytics.total_interactions || 0}</div>
                    <div className="metric-card__label">AI Interactions</div>
                  </div>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="metric-card__content">
                  <div className="metric-card__icon">📦</div>
                  <div className="metric-card__data">
                    <div className="metric-card__value">{analytics.total_chunks || 0}</div>
                    <div className="metric-card__label">Text Chunks</div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && systemMetrics.length > 0 && (
        <div className="admin-section">
          <h2>⚡ System Performance</h2>
          <div className="system-metrics">
            {systemMetrics.slice(0, 1).map((metric, index) => (
              <Card key={index} className="system-metric-card">
                <div className="system-metric__grid">
                  <div className="system-metric__item">
                    <span className="system-metric__label">CPU Usage</span>
                    <span className="system-metric__value">{metric.cpu_usage?.toFixed(1)}%</span>
                  </div>
                  <div className="system-metric__item">
                    <span className="system-metric__label">Memory Usage</span>
                    <span className="system-metric__value">{metric.memory_usage?.toFixed(1)}%</span>
                  </div>
                  <div className="system-metric__item">
                    <span className="system-metric__label">Disk Usage</span>
                    <span className="system-metric__value">{metric.disk_usage?.toFixed(1)}%</span>
                  </div>
                  <div className="system-metric__item">
                    <span className="system-metric__label">Recorded</span>
                    <span className="system-metric__value">{formatDate(metric.timestamp)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent LLM Interactions */}
      <div className="admin-section">
        <h2>🤖 Recent AI Interactions</h2>
        {llmInteractions.length === 0 ? (
          <Card>
            <p>No AI interactions recorded yet.</p>
          </Card>
        ) : (
          <div className="interactions-list">
            {llmInteractions.slice(0, 10).map((interaction) => (
              <Card key={interaction.id} className="interaction-card">
                <div className="interaction-card__header">
                  <span className="interaction-card__date">
                    {formatDate(interaction.timestamp)}
                  </span>
                  <span className="interaction-card__duration">
                    {interaction.response_time?.toFixed(2)}s
                  </span>
                </div>
                <div className="interaction-card__content">
                  <div className="interaction-card__prompt">
                    <strong>Prompt:</strong> {interaction.prompt.substring(0, 100)}
                    {interaction.prompt.length > 100 && '...'}
                  </div>
                  <div className="interaction-card__response">
                    <strong>Response:</strong> {interaction.response.substring(0, 150)}
                    {interaction.response.length > 150 && '...'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Admin Actions */}
      <div className="admin-section">
        <h2>🛠️ Admin Actions</h2>
        <div className="admin-actions">
          <Card className="admin-action-card">
            <h3>🗑️ Data Management</h3>
            <p>Clean up system data to free space and reset analytics.</p>
            <div className="admin-action-buttons">
              <Button
                variant="outline"
                size="small"
                onClick={() => setFlushModal({ isOpen: true, type: 'pdfs' })}
                icon="📄"
              >
                Flush PDFs
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => setFlushModal({ isOpen: true, type: 'interactions' })}
                icon="💬"
              >
                Flush Interactions
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => setFlushModal({ isOpen: true, type: 'metrics' })}
                icon="📊"
              >
                Flush Metrics
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => setFlushModal({ isOpen: true, type: 'all' })}
                icon="🔥"
              >
                Flush All Data
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Flush Confirmation Modal */}
      <Modal
        isOpen={flushModal.isOpen}
        onClose={() => setFlushModal({ isOpen: false, type: '' })}
        title="Confirm Data Flush"
        size="small"
      >
        <div className="flush-modal">
          <p>
            Are you sure you want to flush <strong>{flushModal.type}</strong> data?
          </p>
          <p className="flush-modal__warning">
            This action cannot be undone. All {flushModal.type} data will be permanently deleted.
          </p>
          
          <div className="flush-modal__actions">
            <Button
              variant="ghost"
              onClick={() => setFlushModal({ isOpen: false, type: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleFlushData(flushModal.type)}
              icon="🗑️"
            >
              Flush {flushModal.type}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
