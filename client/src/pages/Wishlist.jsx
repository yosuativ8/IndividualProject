import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchWishlist } from '../store/slices/wishlistSlice';
import PlaceCard from '../component/PlaceCard';

export default function Wishlist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items, isLoading, error } = useSelector((state) => state.wishlist);

  /**
   * useEffect untuk:
   * - Redirect ke login jika user belum login
   * - Fetch wishlist data saat component mount
   */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated, navigate]);

  /**
   * Handle retry fetch wishlist jika terjadi error
   * Dispatch ulang action fetchWishlist
   */
  const handleRetry = () => {
    dispatch(fetchWishlist());
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h2"><i className="bi bi-heart-fill text-danger"></i> My Wishlist</h1>
        <p className="text-muted">Your saved destinations for future adventures</p>
      </div>

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your wishlist...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button onClick={handleRetry} className="btn btn-sm btn-outline-danger ms-3">
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {items.length > 0 ? (
            <div className="row g-4">
              {items.map((item) => (
                <div key={item.id} className="col-md-6 col-lg-4">
                  <PlaceCard place={item.place || item.Place} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="display-1 mb-3"><i className="bi bi-heart text-muted"></i></div>
              <h3>Your wishlist is empty</h3>
              <p className="text-muted mb-4">Start adding places you'd like to visit!</p>
              <button 
                onClick={() => navigate('/')}
                className="btn btn-primary"
              >
                Explore Places
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}