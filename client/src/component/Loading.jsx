// Loading Component - Komponen untuk menampilkan loading state
// Digunakan saat data sedang di-fetch dari API

import React from 'react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}
