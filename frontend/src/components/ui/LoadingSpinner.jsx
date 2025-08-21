import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...', className = '' }) => {
  return (
    <div className={`loading-spinner ${className}`}>
      <div className={`spinner spinner--${size}`}>
        <div className="spinner__ring"></div>
        <div className="spinner__ring"></div>
        <div className="spinner__ring"></div>
      </div>
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
