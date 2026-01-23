// Navbar Component - Navigation bar dengan search bar dan auth
// Search bar ada di navbar, logout button untuk authenticated users

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { setFilterQuery } from '../store/slices/placesSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { filterQuery } = useSelector((state) => state.places);

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Handle filter - update Redux state untuk filter cards di Home/Wishlist
  const handleFilterChange = (e) => {
    const query = e.target.value;
    dispatch(setFilterQuery(query));
  };
  
  // Clear filter
  const handleClearFilter = () => {
    dispatch(setFilterQuery(''));
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-lg" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem 0'
    }}>
      <div className="container">
        {/* Logo with Animation */}
        <Link to="/" className="navbar-brand fw-bold" style={{
          fontSize: '1.8rem',
          letterSpacing: '1px',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-airplane-fill" style={{ 
            marginRight: '8px',
            color: '#ffd700',
            filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.5))'
          }}></i>
          <span style={{ 
            background: 'linear-gradient(to right, #fff, #ffd700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '900'
          }}>NextTrip</span>
        </Link>

        {/* Toggle button for mobile */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 12px',
            borderRadius: '8px'
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Content */}
        <div className="collapse navbar-collapse" id="navbarContent">
          {/* Navigation Links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-4">
            {isAuthenticated && (
              <li className="nav-item">
                <Link to="/wishlist" className="nav-link" style={{
                  fontSize: '1.05rem',
                  fontWeight: '500',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255,255,255,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <i className="bi bi-heart-fill" style={{ 
                    color: '#ff6b9d',
                    marginRight: '6px',
                    filter: 'drop-shadow(0 0 3px rgba(255,107,157,0.5))'
                  }}></i> 
                  My Wishlist
                </Link>
              </li>
            )}
          </ul>

          {/* Search Form - Modern Style */}
          <div className="d-flex mx-auto align-items-center my-2 my-lg-0" style={{ maxWidth: '550px', flex: 1 }}>
            <div className="input-group" style={{ 
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <span className="input-group-text border-0" style={{
                background: 'white',
                color: '#667eea',
                padding: '12px 16px'
              }}>
                <i className="bi bi-search" style={{ fontSize: '1.2rem' }}></i>
              </span>
              <input
                className="form-control border-0"
                type="text"
                placeholder="Search destinations..."
                value={filterQuery}
                onChange={handleFilterChange}
                style={{
                  padding: '12px 16px',
                  fontSize: '1rem',
                  background: 'white'
                }}
              />
              {filterQuery && (
                <button 
                  className="btn border-0" 
                  type="button"
                  onClick={handleClearFilter}
                  title="Clear filter"
                  style={{
                    background: '#f8f9fa',
                    color: '#667eea',
                    padding: '0 16px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          {/* Auth Section - Modern Buttons */}
          <div className="d-flex align-items-center ms-3 mt-2 mt-lg-0">
            {isAuthenticated ? (
              <>
                <div className="me-3" style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="bi bi-person-circle me-2" style={{ fontSize: '1.2rem' }}></i>
                  <span style={{ fontWeight: '500' }}>
                    {user?.email ? user.email.split('@')[0] : 'User'}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn" style={{
                  background: 'white',
                  color: '#667eea',
                  fontWeight: '600',
                  padding: '8px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn" style={{
                background: 'white',
                color: '#667eea',
                fontWeight: '600',
                padding: '10px 32px',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              }}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
