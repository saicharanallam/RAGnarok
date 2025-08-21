import React from 'react';
import Button from './Button';
import Card from './Card';
import './ErrorState.css';

const ErrorState = ({ 
  title = 'Something went wrong', 
  message = 'Unable to load data. Please check your connection and try again.',
  icon = '⚠️',
  onRetry,
  showRetry = true,
  className = ''
}) => {
  return (
    <Card className={`error-state ${className}`}>
      <div className="error-state__content">
        <div className="error-state__icon">{icon}</div>
        <h3 className="error-state__title">{title}</h3>
        <p className="error-state__message">{message}</p>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="small"
            onClick={onRetry}
            icon="🔄"
          >
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ErrorState;
