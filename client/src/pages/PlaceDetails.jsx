import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlaceById, getAIRecommendation, clearCurrentPlace } from '../store/slices/placesSlice';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';

export default function PlaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentPlace, aiRecommendation, isLoading, error } = useSelector((state) => state.places);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  
  // State untuk toggle tampilan AI recommendation
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);

  /**
   * useEffect untuk fetch detail place saat component mount
   * Cleanup: clear currentPlace saat component unmount
   */
  useEffect(() => {
    dispatch(fetchPlaceById(id));
    return () => {
      dispatch(clearCurrentPlace());
    };
  }, [dispatch, id]);

  /**
   * Check apakah place ini sudah ada di wishlist user
   * Compare placeId dari wishlist dengan id place saat ini
   */
  const isInWishlist = currentPlace && Array.isArray(wishlistItems) && wishlistItems.some(item => 
    item && item.placeId === currentPlace.id
  );

  /**
   * Handle toggle wishlist (add/remove)
   * - Redirect ke login jika user belum login
   * - Remove dari wishlist jika sudah ada
   * - Add ke wishlist jika belum ada
   */
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isInWishlist) {
        const wishlistItem = wishlistItems.find(item => item && item.placeId === currentPlace.id);
        if (wishlistItem && wishlistItem.id) {
          await dispatch(removeFromWishlist(wishlistItem.id)).unwrap();
        }
      } else {
        await dispatch(addToWishlist(currentPlace.id)).unwrap();
      }
    } catch (error) {
      if (!error.toString().includes('already in your wishlist')) {
        console.error('Wishlist error:', error);
        alert(error || 'Failed to update wishlist');
      }
    }
  };

  /**
   * Handle request AI recommendation dari Gemini
   * - Redirect ke login jika user belum login
   * - Dispatch action untuk fetch recommendation dari backend
   * - Show recommendation section
   */
  const handleGetRecommendation = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(getAIRecommendation(id));
    setShowAIRecommendation(true);
  };

  const handleRetry = () => {
    dispatch(fetchPlaceById(id));
  };

  if (isLoading && !currentPlace) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading place details...</p>
      </div>
    );
  }

  if (error && !currentPlace) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
          <button onClick={handleRetry} className="btn btn-sm btn-outline-danger ms-3">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentPlace && !isLoading) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          Place not found
          <button onClick={() => navigate('/')} className="btn btn-sm btn-outline-warning ms-3">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <button onClick={() => navigate(-1)} className="btn btn-outline-secondary mb-4">
        ← Back
      </button>

      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <img 
              src={currentPlace.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'} 
              className="card-img-top"
              alt={currentPlace.name}
              style={{ height: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
              }}
            />
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="card-title h2 mb-2">{currentPlace.name}</h1>
                  {currentPlace.category && (
                    <span className="badge bg-primary">{currentPlace.category}</span>
                  )}
                </div>
                <button 
                  onClick={handleWishlistToggle}
                  className={`btn ${isInWishlist ? 'btn-danger' : 'btn-outline-danger'}`}
                >
                  <i className={`bi ${isInWishlist ? 'bi-heart-fill' : 'bi-heart'}`}></i> {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              <div className="mb-3">
                <span className="text-muted"><i className="bi bi-geo-alt-fill"></i> {currentPlace.location || currentPlace.city || 'Unknown Location'}</span>
              </div>

              <h5>About This Place</h5>
              <p className="text-muted">{currentPlace.description || 'No description available.'}</p>

              {currentPlace.address && (
                <p className="mb-2"><strong>Address:</strong> {currentPlace.address}</p>
              )}
              
              {currentPlace.rating && (
                <p className="mb-2"><strong>Rating:</strong> <i className="bi bi-star-fill text-warning"></i> {currentPlace.rating}/5</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}