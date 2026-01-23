import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlaceCard from '../component/PlaceCard';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ambil search query dan results dari location state (passed dari SearchBar)
  const searchQuery = location.state?.query || '';
  const passedResults = location.state?.results || [];
  const passedError = location.state?.error || null;
  
  const [results, setResults] = useState(passedResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(passedError);

  /**
   * useEffect untuk update state ketika location.state berubah (second search, third search, etc)
   */
  useEffect(() => {
    setResults(passedResults);
    setError(passedError);
  }, [passedResults, passedError, location.key]);

  /**
   * useEffect untuk redirect ke home jika tidak ada query dan results
   */
  useEffect(() => {
    if (!searchQuery && results.length === 0) {
      navigate('/');
    }
  }, [searchQuery, results, navigate]);

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
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle"></i> {error}
        </div>
      )}

      {!isLoading && (
        <>
          {results.length > 0 ? (
            <div className="row g-4">
              {results.map((place, index) => (
                <div key={place.id || index} className="col-md-6 col-lg-4">
                  <PlaceCard place={place} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="display-1 mb-3"><i className="bi bi-search"></i></div>
              <h3>No places found for "{searchQuery}"</h3>
              <p className="text-muted">Try searching with different keywords</p>
              <p className="text-muted">Examples: "Borobudur", "Bali", "pantai", "gunung"</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}