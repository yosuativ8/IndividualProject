import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PlaceCard from '../component/PlaceCard';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, isLoading, error } = useSelector((state) => state.places);
  
  // Ambil search query dari location state (passed dari Navbar search)
  const searchQuery = location.state?.query || '';

  /**
   * useEffect untuk redirect ke home jika:
   * - Tidak ada search query DAN
   * - Tidak ada search results
   * Mencegah user akses halaman search tanpa melakukan search
   */
  useEffect(() => {
    if (!searchQuery && searchResults.length === 0) {
      navigate('/');
    }
  }, [searchQuery, searchResults, navigate]);

  return (
    <div className="container py-4">
      {searchQuery && (
        <div className="mb-4">
          <h2 className="h4">Search results for: <span className="text-primary">"{searchQuery}"</span></h2>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Searching places...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
          {searchResults.length > 0 ? (
            <div className="row g-4">
              {searchResults.map((place, index) => (
                <div key={place.id || index} className="col-md-6 col-lg-4">
                  <PlaceCard place={place} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="display-1 mb-3"><i className="bi bi-search"></i></div>
              <h3>No places found</h3>
              <p className="text-muted">Try searching with a different location</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}