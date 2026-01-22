// Footer Component - Komponen footer di bagian bawah aplikasi
// Menampilkan informasi copyright dan links

import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title"><i className="bi bi-globe-americas"></i> NextTrip</h3>
          <p className="footer-description">
            Discover amazing places around the world and plan your next adventure!
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/search">Search Places</Link></li>
            <li><Link to="/wishlist">My Wishlist</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Features</h4>
          <ul className="footer-links">
            <li><i className="bi bi-robot"></i> AI-Powered Recommendations</li>
            <li><i className="bi bi-geo-alt-fill"></i> Location-Based Search</li>
            <li><i className="bi bi-heart-fill text-danger"></i> Personal Wishlist</li>
            <li><i className="bi bi-shield-lock-fill"></i> Secure Authentication</li>
          </ul>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} NextTrip. All rights reserved.</p>
          <p className="footer-credit">Built with React, Redux, and <i className="bi bi-heart-fill text-danger"></i></p>
        </div>
      </div>
    </footer>
  );
}
