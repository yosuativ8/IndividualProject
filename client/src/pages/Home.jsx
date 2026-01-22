// Home Page - Halaman utama aplikasi
// Menampilkan daftar semua places dalam grid layout
// Non-user bisa lihat tapi tidak bisa add wishlist

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlaces, fetchNearbyPlaces } from '../store/slices/placesSlice';
import { fetchWishlist } from '../store/slices/wishlistSlice';
import PlaceCard from '../component/PlaceCard';
import MapSelector from '../component/MapSelector';

export default function Home() {
  const dispatch = useDispatch();
  const { places, nearbyPlaces, isLoading, error } = useSelector((state) => state.places);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // State untuk koordinat lokasi yang dipilih dari map
  const [selectedLocation, setSelectedLocation] = useState(null);
  // State untuk toggle antara all places vs nearby places
  const [showNearby, setShowNearby] = useState(false);
  // State untuk toggle "Show More" / "Show Less" places
  const [showAll, setShowAll] = useState(false);
  // State untuk track index background image yang sedang aktif
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Array background images untuk slideshow
  const backgroundImages = [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80', // Bali temple
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1920&q=80', // Beach sunset
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', // Mountain landscape
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80', // Lake view
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80', // Indonesian scenery
  ];

  /**
   * useEffect untuk fetch data saat component mount:
   * - Fetch all places dari database
   * - Fetch wishlist jika user sudah login
   */
  useEffect(() => {
    dispatch(fetchPlaces());
    
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  /**
   * useEffect untuk auto slide background images
   * Ganti background setiap 5 detik
   * Cleanup: clear interval saat component unmount
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  /**
   * Handle location selection dari map click
   * - Set koordinat yang dipilih
   * - Toggle ke mode "nearby places"
   * - Fetch nearby places dari Geoapify API berdasarkan koordinat
   */
  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    setShowNearby(true);
    await dispatch(fetchNearbyPlaces({ 
      lat: location.lat, 
      lon: location.lon, 
      radius: 50000 // 50km radius
    }));
  };

  /**
   * Handle back to all places dari nearby mode
   * Reset state ke kondisi awal (tampilkan database places)
   */
  const handleShowAllPlaces = () => {
    setShowNearby(false);
    setSelectedLocation(null);
  };

  /**
   * Handle retry saat fetch data error
   * - Jika dalam nearby mode: retry fetch nearby places
   * - Jika dalam all places mode: retry fetch all places
   */
  const handleRetry = () => {
    if (showNearby && selectedLocation) {
      dispatch(fetchNearbyPlaces({ 
        lat: selectedLocation.lat, 
        lon: selectedLocation.lon, 
        radius: 50000 
      }));
    } else {
      dispatch(fetchPlaces());
    }
  };

  // Tentukan places mana yang akan ditampilkan
  const allDisplayPlaces = showNearby ? (nearbyPlaces || []) : (places || []);
  
  // Deduplicate by name (case-insensitive)
  const uniquePlaces = [];
  const seenNames = new Set();
  
  allDisplayPlaces.forEach(place => {
    const placeName = place.name?.toLowerCase();
    if (placeName && !seenNames.has(placeName)) {
      seenNames.add(placeName);
      uniquePlaces.push(place);
    }
  });
  
  const displayPlaces = showAll ? uniquePlaces : uniquePlaces.slice(0, 6);

  // Toggle show all/hide
  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="home-page" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background Image Slideshow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a'
      }}>
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentBgIndex === index ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              transform: currentBgIndex === index ? 'scale(1)' : 'scale(1.05)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '1.5s, 10s',
            }}
          />
        ))}
      </div>

      <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
        {/* Page Title */}
        <div className="text-center mb-4 p-4" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 className="display-4 fw-bold mb-3" style={{ color: '#2c3e50' }}>
            {showNearby ? (
              <><i className="bi bi-geo-alt-fill"></i> Nearby Destinations</>
            ) : (
              <><i className="bi bi-globe-americas"></i> Popular Destinations</>
            )}
          </h1>
          <p className="lead" style={{ color: '#555' }}>
            {showNearby 
              ? 'Destinations near your selected location' 
              : 'Discover amazing places around Indonesia'}
          </p>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-5" style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '15px',
            padding: '50px',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: '#2c3e50' }}>Loading amazing places...</p>
            <small className="text-muted d-block mt-2">
              Total places: {places?.length || 0}
            </small>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="alert alert-danger text-center" role="alert" style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <h4 className="alert-heading">Oops! Something went wrong</h4>
            <p>{error}</p>
            <button onClick={handleRetry} className="btn btn-danger">
              Try Again
            </button>
          </div>
        )}

        {/* Places Grid - Tampil Dulu */}
        {!isLoading && !error && (
          <>
            {displayPlaces && displayPlaces.length > 0 ? (
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '15px',
                padding: '30px',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="mb-4">
                  <h4 style={{ color: '#2c3e50', margin: 0 }}>
                    {showNearby 
                      ? `Found ${uniquePlaces.length} destinations nearby` 
                      : `${uniquePlaces.length} destinations available`}
                  </h4>
                </div>
                
                {/* Grid 6 atau semua destinations */}
                <div className="row g-4">
                  {displayPlaces.map((place, index) => (
                    <div key={place.id || index} className="col-md-6 col-lg-4">
                      <PlaceCard place={place} />
                    </div>
                  ))}
                </div>
                
                {/* Show All / Show Less Button - DIBAWAH GRID */}
                {allDisplayPlaces.length > 6 && (
                  <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid #e0e0e0' }}>
                    {!showAll && (
                      <p className="text-muted mb-3">
                        {allDisplayPlaces.length - 6} more destinations available
                      </p>
                    )}
                    <button 
                      onClick={toggleShowAll}
                      className="btn btn-primary btn-lg px-5"
                    >
                      {showAll ? (
                        <><i className="bi bi-list"></i> Show Less Destinations</>
                      ) : (
                        <><i className="bi bi-search"></i> Show All Destinations</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-5" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '15px',
                padding: '30px'
              }}>
                <h3>
                  {showNearby 
                    ? 'No destinations found nearby' 
                    : 'No places found'}
                </h3>
                <p className="text-muted">
                  {showNearby 
                    ? 'Try selecting a different location on the map' 
                    : 'Start exploring!'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Map Section - Dibawah Places */}
        <div className="card border-0 shadow-lg mt-5" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body">
            <h5 className="card-title mb-3">
              <i className="bi bi-map"></i> Find Destinations Near You
            </h5>
            <p className="text-muted small mb-3">
              Click on the map to discover destinations within 50km radius
            </p>
            <MapSelector 
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
            {showNearby && (
              <div className="text-center mt-3">
                <button 
                  onClick={handleShowAllPlaces}
                  className="btn btn-outline-primary"
                >
                  ← Back to All Destinations
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}