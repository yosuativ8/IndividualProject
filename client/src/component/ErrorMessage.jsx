// ErrorMessage Component - Komponen untuk menampilkan error message
// Digunakan saat terjadi error dalam fetching data atau operasi lainnya

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
