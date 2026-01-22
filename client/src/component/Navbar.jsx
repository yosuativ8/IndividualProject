// Navbar Component - Navigation bar dengan search bar dan auth
// Search bar ada di navbar, logout button untuk authenticated users

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { searchPlacesByLocation } from '../store/slices/placesSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    // Dispatch search action
    await dispatch(searchPlacesByLocation(searchQuery));
    
    // Navigate to search results page
    navigate('/search', { state: { query: searchQuery } });
    setSearchQuery(''); // Clear search after submit
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        {/* Logo */}
        <Link to="/" className="navbar-brand fw-bold">
          <i className="bi bi-globe-americas"></i> NextTrip
        </Link>

        {/* Toggle button for mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Content */}
        <div className="collapse navbar-collapse" id="navbarContent">
          {/* Navigation Links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated && (
              <li className="nav-item">
                <Link to="/wishlist" className="nav-link">
                  <i className="bi bi-heart-fill"></i> My Wishlist
                </Link>
              </li>
            )}
          </ul>

          {/* Search Form - Centered */}
          <form className="d-flex mx-auto" onSubmit={handleSearch} role="search" style={{ maxWidth: '500px', flex: 1 }}>
            <input
              className="form-control"
              type="search"
              placeholder="Search places... (Press Enter)"
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Auth Section */}
          <div className="d-flex align-items-center ms-3">
            {isAuthenticated ? (
              <>
                <span className="text-white me-3">
                  Hi, {user?.email ? user.email.split('@')[0] : 'User'}!
                </span>
                <button onClick={handleLogout} className="btn btn-outline-light">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-light">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
