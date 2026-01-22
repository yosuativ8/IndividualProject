// SearchBar Component - Komponen untuk search places
// Digunakan di Home page dan Search page
// Search berdasarkan location menggunakan Geoapify API

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { searchPlacesByLocation } from '../store/slices/placesSlice';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle search submit
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      alert('Please enter a location to search');
      return;
    }

    // Dispatch search action
    await dispatch(searchPlacesByLocation(searchQuery));
    
    // Navigate to search results page
    navigate('/search', { state: { query: searchQuery } });
  };

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search places by location (e.g., Bali, Jakarta)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-btn">
          <i className="bi bi-search"></i> Search
        </button>
      </div>
    </form>
  );
}
