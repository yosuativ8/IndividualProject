/**
 * PlaceCard Component
 * 
 * Reusable card component untuk menampilkan destinasi wisata dalam grid layout.
 * 
 * Features:
 * - Display place image dengan lazy loading
 * - Display place name, location, category, rating
 * - Wishlist toggle button (heart icon)
 * - Click to navigate ke detail page
 * - Error handling untuk broken images
 * - Hover effects untuk better UX
 * 
 * Props:
 * @param {Object} place - Place object dari database atau API
 * @param {number} place.id - Place ID (null jika dari Gemini & belum di DB)
 * @param {string} place.name - Nama destinasi
 * @param {string|Object} place.location - Lokasi (string atau {lat, lon})
 * @param {string} place.imageUrl - URL gambar destinasi
 * @param {string} place.category - Kategori (Pantai/Gunung/dll)
 * @param {number} place.rating - Rating 0-5
 * @param {string} place.description - Deskripsi singkat
 * 
 * Authentication:
 * - Semua user bisa lihat card
 * - Hanya authenticated user bisa add/remove wishlist
 * - Non-auth user akan di-redirect ke login saat klik wishlist button
 * 
 * @component
 * @example
 * <PlaceCard place={placeData} />
 */

import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';

export default function PlaceCard({ place }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  /**
   * Check Wishlist Status
   * 
   * Cek apakah place ini sudah ada di wishlist user.
   * Safe check dengan Array.isArray untuk prevent error.
   * 
   * @returns {boolean} true jika place ada di wishlist
   */
  const isInWishlist = Array.isArray(wishlistItems) && place?.id && wishlistItems.some(item => 
    item && item.placeId === place.id
  );

  /**
   * Handle Wishlist Toggle
   * 
   * Toggle add/remove place from wishlist.
   * 
   * Flow:
   * 1. Check authentication (redirect to login jika belum login)
   * 2. Check place.id (prevent error untuk Gemini results tanpa ID)
   * 3. If in wishlist → remove
   * 4. If not in wishlist → add
   * 5. Error handling (skip \"already in wishlist\" error)
   * 
   * @param {Event} e - Click event
   */
  const handleWishlistToggle = async (e) => {
    e.preventDefault(); // Prevent navigation ke detail page
    
    // Check authentication
    if (!isAuthenticated) {
      alert('Please login to add places to your wishlist');
      navigate('/login');
      return;
    }

    // Check place ID (Gemini results mungkin tidak punya ID)
    if (!place.id) {
      alert('This destination is not yet available in our database. Please try searching for similar destinations.');
      return;
    }

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const wishlistItem = wishlistItems.find(item => item && item.placeId === place.id);
        if (wishlistItem && wishlistItem.id) {
          await dispatch(removeFromWishlist(wishlistItem.id)).unwrap();
        }
      } else {
        // Add to wishlist
        await dispatch(addToWishlist(place.id)).unwrap();
      }
    } catch (error) {
      // Skip \"already in wishlist\" error (race condition dari multiple clicks)
      if (!error.toString().includes('already in your wishlist')) {
        console.error('Wishlist error:', error);
        alert(error || 'Failed to update wishlist');
      }
    }
  };

  // Default image jika imageUrl kosong atau broken
  const imageUrl = place.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80';

  /**
   * Format Location Text
   * 
   * Handle location yang bisa berupa string atau object coordinates.
   * - String: \"Bali, Indonesia\" → langsung display
   * - Object: {lat: -8.4095, lon: 115.1889} → format jadi \"lat, lon\"
   */
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
