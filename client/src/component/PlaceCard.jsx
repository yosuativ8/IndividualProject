// PlaceCard Component - Card untuk menampilkan place
// Bootstrap card component dengan wishlist button
// Hanya authenticated users yang bisa add to wishlist

import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';

export default function PlaceCard({ place }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Check if place is already in wishlist - with safe check
  const isInWishlist = Array.isArray(wishlistItems) && place?.id && wishlistItems.some(item => 
    item && item.placeId === place.id
  );

  // Handle add/remove from wishlist
  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to add places to your wishlist');
      navigate('/login');
      return;
    }

    // Check jika place tidak punya ID (dari Gemini tapi tidak ada di database)
    if (!place.id) {
      alert('This destination is not yet available in our database. Please try searching for similar destinations.');
      return;
    }

    try {
      if (isInWishlist) {
        const wishlistItem = wishlistItems.find(item => item && item.placeId === place.id);
        if (wishlistItem && wishlistItem.id) {
          await dispatch(removeFromWishlist(wishlistItem.id)).unwrap();
        }
      } else {
        await dispatch(addToWishlist(place.id)).unwrap();
      }
    } catch (error) {
      // Only show alert if it's not "already in wishlist" error
      if (!error.toString().includes('already in your wishlist')) {
        console.error('Wishlist error:', error);
        alert(error || 'Failed to update wishlist');
      }
    }
  };

  // Default image jika imageUrl kosong atau null
  const imageUrl = place.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80';

  // Handle location - bisa string atau object {lat, lon}
  const locationText = typeof place.location === 'string' 
    ? place.location 
    : place.location?.lat 
      ? `${place.location.lat.toFixed(2)}, ${place.location.lon.toFixed(2)}` 
      : 'Unknown Location';

  return (
    <div className="card h-100 shadow-sm hover-card">
      {place.id ? (
        <Link to={`/place/${place.id}`} className="text-decoration-none text-dark">
          {/* Place Image */}
          <div className="position-relative" style={{ overflow: 'hidden', borderTopLeftRadius: '0.375rem', borderTopRightRadius: '0.375rem' }}>
            <img 
              src={imageUrl}
              className="card-img-top" 
              alt={place.name}
              style={{ 
                height: '200px', 
                objectFit: 'cover',
                transition: 'opacity 0.3s ease-in-out'
              }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80';
              }}
            />
            {/* Wishlist Button */}
            <button 
              className={`btn btn-sm position-absolute top-0 end-0 m-2 ${
                isInWishlist ? 'btn-danger' : 'btn-light'
              }`}
              onClick={handleWishlistToggle}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{ 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px',
                transition: 'all 0.3s ease'
              }}
            >
              <i className={`bi ${isInWishlist ? 'bi-heart-fill text-white' : 'bi-heart'}`}></i>
            </button>
          </div>

          {/* Place Info */}
          <div className="card-body">
            <h5 className="card-title">{place.name}</h5>
            <p className="card-text text-muted mb-2">
              <i className="bi bi-geo-alt-fill"></i> {locationText}
            </p>
            {place.category && (
              <span className="badge bg-primary mb-2">{place.category}</span>
            )}
            {place.description && (
              <p className="card-text small text-muted">
                {place.description.substring(0, 100)}...
              </p>
            )}
            {place.rating && (
              <div className="mt-2">
                <i className="bi bi-star-fill text-warning"></i>
                <span className="ms-1">{place.rating}/5</span>
              </div>
            )}
          </div>
        </Link>
      ) : (
        // Jika tidak ada ID (places dari Gemini yang belum ada di database), tampilkan card tanpa link
        <div>
          {/* Place Image */}
          <div className="position-relative" style={{ overflow: 'hidden', borderTopLeftRadius: '0.375rem', borderTopRightRadius: '0.375rem' }}>
            <img 
              src={imageUrl}
              className="card-img-top" 
              alt={place.name}
              style={{ 
                height: '200px', 
                objectFit: 'cover',
                transition: 'opacity 0.3s ease-in-out'
              }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80';
              }}
            />
            {/* Disabled Wishlist Button */}
            <button 
              className="btn btn-sm btn-secondary position-absolute top-0 end-0 m-2"
              disabled
              title="Not available in database"
              style={{ 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px',
                opacity: 0.6
              }}
            >
              <i className="bi bi-heart"></i>
            </button>
          </div>

          {/* Place Info */}
          <div className="card-body">
            <h5 className="card-title">{place.name}</h5>
            <p className="card-text text-muted mb-2">
              <i className="bi bi-geo-alt-fill"></i> {locationText}
            </p>
            {place.category && (
              <span className="badge bg-primary mb-2">{place.category}</span>
            )}
            {place.description && (
              <p className="card-text small text-muted">
                {place.description.substring(0, 100)}...
              </p>
            )}
            {place.rating && (
              <div className="mt-2">
                <i className="bi bi-star-fill text-warning"></i>
                <span className="ms-1">{place.rating}/5</span>
              </div>
            )}
            <small className="text-muted d-block mt-2">
              <i className="bi bi-info-circle"></i> Info only (not yet in database)
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
