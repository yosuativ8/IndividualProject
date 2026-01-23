// SearchBar Component - Komponen untuk search places
// Digunakan di Home page dan Search page
// Search berdasarkan name atau location, bisa langsung ke detail page

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle search submit
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      alert('Please enter a place name or location to search');
      return;
    }

    setIsSearching(true);

    try {
      // Search places by name or location from backend
      const response = await axios.get(`${API_URL}/places/search`, {
        params: { q: searchQuery.trim() }
      });

      const results = response.data.places || [];

      if (results.length === 1) {
        // Jika hanya 1 hasil, langsung redirect ke detail page
        navigate(`/place/${results[0].id}`);
      } else {
        // Jika banyak hasil atau tidak ada hasil, navigate ke search results page
        navigate('/search', { 
          state: { 
            query: searchQuery,
            results: results 
          } 
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      // Navigate ke search results dengan empty results untuk tampilkan error
      navigate('/search', { 
        state: { 
          query: searchQuery,
          results: [],
          error: error.response?.data?.message || 'Failed to search places. Please try again.'
        } 
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search places... (Press Enter)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isSearching}
        />
        <button type="submit" className="search-btn" disabled={isSearching}>
          <i className="bi bi-search"></i> {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}
