import React, { useState, useEffect } from 'react';
import './Notification.css';

const Notification = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  action
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`notification notification--${type} ${isExiting ? 'notification--exiting' : ''}`}>
      <div className="notification__content">
        <span className="notification__icon">{getIcon()}</span>
        <span className="notification__message">{message}</span>
      </div>
      <div className="notification__actions">
        {action && (
          <button className="notification__action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
        <button className="notification__close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

// Notification Container Component
export const NotificationContainer = ({ notifications = [] }) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
        />
      ))}
    </div>
  );
};

export default Notification;
