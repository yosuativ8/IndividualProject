/**
 * Loading Component
 * 
 * Menampilkan loading spinner dengan custom message.
 * Digunakan saat fetch data dari API.
 * 
 * Props:
 * @param {string} message - Loading message (default: 'Loading...')
 * 
 * @component
 */
import React from 'react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}
