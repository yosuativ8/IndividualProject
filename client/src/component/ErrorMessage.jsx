/**
 * ErrorMessage Component
 * 
 * Menampilkan error message dengan icon dan retry button.
 * 
 * Props:
 * @param {string} message - Error message yang akan ditampilkan
 * @param {function} onRetry - Callback function untuk retry action (optional)
 * 
 * @component
 */
import React from 'react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon"><i className="bi bi-exclamation-triangle-fill text-warning"></i></div>
      <h3 className="error-title">Oops! Something went wrong</h3>
      <p className="error-message">{message || 'An unexpected error occurred'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-retry">
          Try Again
        </button>
      )}
    </div>
  );
}
