/**
 * Home Page Component
 * 
 * Halaman utama aplikasi NextTrip yang menampilkan:
 * - Hero section dengan background slideshow
 * - Grid layout destinasi wisata
 * - Filter by category (All/Pantai/Gunung/dll)
 * - Toggle between All Places vs Nearby Places
 * - Interactive map untuk select location
 * - Integration dengan ChatBot results
 * 
 * Features:
 * - Auto-slide background images (5 detik interval)
 * - Lazy load places (Show More/Less)
 * - Location-based search (map click)
 * - Responsive grid layout (1-3 columns)
 * 
 * Access: Public (semua user bisa lihat, tapi wishlist butuh login)
 * 
 * @component
 * @example
 * <Route path="/" element={<Home />} />
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlaces, fetchNearbyPlaces, resetChatbotResults, clearNearbyPlaces } from '../store/slices/placesSlice';
import { fetchWishlist } from '../store/slices/wishlistSlice';
import PlaceCard from '../component/PlaceCard';
import MapSelector from '../component/MapSelector';

export default function Home() {
  const dispatch = useDispatch();
  
  // Redux state untuk places data dan loading state
  const { places, nearbyPlaces, mapCenter, showChatbotResults, filterQuery, isLoading, error } = useSelector((state) => state.places);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Local state untuk UI controls
  const [selectedLocation, setSelectedLocation] = useState(null); // Koordinat dari map
  const [showNearby, setShowNearby] = useState(false); // Toggle all places vs nearby
  const [showAll, setShowAll] = useState(false); // Toggle show 6 vs show all
  const [currentBgIndex, setCurrentBgIndex] = useState(0); // Index background slideshow

  /**
   * Background Images Array
   * Array URL gambar untuk hero background slideshow
   * Auto-slide setiap 5 detik (controlled by useEffect)
   */
  const backgroundImages = [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80', // Bali temple
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1920&q=80', // Beach sunset
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', // Mountain landscape
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80', // Lake view
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80', // Indonesian scenery
  ];

  /**
   * Effect: Handle ChatBot Results
   * 
   * Ketika ChatBot mengirim hasil pencarian:
   * - Auto switch ke nearby mode
   * - Set map center ke koordinat hasil
   * - Reset showAll ke false (show 6 cards first)
   * - Reset chatbot results flag
   * 
   * Dependencies: showChatbotResults, nearbyPlaces.length, mapCenter
   */
  useEffect(() => {
    if (showChatbotResults) {
      console.log('ChatBot results detected:', { nearbyPlaces: nearbyPlaces.length, mapCenter });
      
      if (nearbyPlaces.length > 0) {
        setShowNearby(true);
        setShowAll(false); // Reset ke show 6 cards dulu
        
        if (mapCenter) {
          setSelectedLocation({ lat: mapCenter.lat, lon: mapCenter.lon });
        }
      }
      
      // Reset flag hanya setelah diproses (tapi tetap keep nearbyPlaces data)
      dispatch(resetChatbotResults());
    }
  }, [showChatbotResults, nearbyPlaces.length, mapCenter, dispatch]);

  /**
   * useEffect untuk restore nearby mode jika ada nearbyPlaces dari pencarian sebelumnya
   * Ini akan keep hasil search tetap visible saat kembali dari page lain
   */
  useEffect(() => {
    if (nearbyPlaces.length > 0 && !showChatbotResults) {
      // Jika ada nearbyPlaces tapi bukan dari chatbot baru, restore view
      setShowNearby(true);
      if (mapCenter) {
        setSelectedLocation({ lat: mapCenter.lat, lon: mapCenter.lon });
      }
    }
  }, []); // Run once on mount to restore previous search

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
    // Clear nearby places dan map center dari Redux + localStorage
    dispatch(clearNearbyPlaces());
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
  
  console.log('Home.jsx display logic:', { 
    showNearby, 
    nearbyPlacesCount: nearbyPlaces?.length || 0,
    placesCount: places?.length || 0,
    allDisplayPlacesCount: allDisplayPlaces.length 
  });
  
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
  
  console.log('After deduplication:', uniquePlaces.length, 'unique places');
  
  // Filter berdasarkan filter query dari Navbar (Redux state)
  const filteredPlaces = uniquePlaces.filter(place => {
    if (!filterQuery.trim()) return true;
    
    const query = filterQuery.toLowerCase();
    return (
      place.name?.toLowerCase().includes(query) ||
      place.location?.toLowerCase().includes(query) ||
      place.description?.toLowerCase().includes(query) ||
      place.category?.toLowerCase().includes(query)
    );
  });
  
  const displayPlaces = showAll ? filteredPlaces : filteredPlaces.slice(0, 6);

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
        {/* Page Title - Modern Hero Section */}
        <div className="text-center mb-5 p-5" style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.5)'
        }}>
          <h1 className="display-3 fw-bold mb-3" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            {showNearby ? (
              <>
                <i className="bi bi-geo-alt-fill me-3" style={{ 
                  color: '#667eea',
                  WebkitTextFillColor: '#667eea',
                  filter: 'drop-shadow(0 2px 8px rgba(102,126,234,0.4))'
                }}></i>
                Nearby Destinations
              </>
            ) : (
              <>
                <i className="bi bi-compass-fill me-3" style={{ 
                  color: '#667eea',
                  WebkitTextFillColor: '#667eea',
                  filter: 'drop-shadow(0 2px 8px rgba(102,126,234,0.4))'
                }}></i>
                Discover Paradise
              </>
            )}
          </h1>
          <p className="lead mb-4" style={{ 
            color: '#555',
            fontSize: '1.3rem',
            fontWeight: '400'
          }}>
            {showNearby 
              ? '🗺️ Amazing destinations near your selected location' 
              : '🌴 Find your perfect getaway destination'}
          </p>
        </div>
        
        {/* Loading State - Modern */}
        {isLoading && (
          <div className="text-center py-5" style={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            borderRadius: '24px',
            padding: '60px 40px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div className="spinner-border" style={{ 
              width: '4rem', 
              height: '4rem',
              borderWidth: '0.3rem',
              color: '#667eea'
            }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-4 mb-0" style={{ 
              color: '#2c3e50',
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              <i className="bi bi-stars me-2"></i>
              Loading amazing places...
            </p>
            <small className="text-muted d-block mt-3" style={{ fontSize: '1rem' }}>
              Preparing {places?.length || 0} destinations for you
            </small>
          </div>
        )}

        {/* Error State - Modern */}
        {error && !isLoading && (
          <div className="text-center py-5" role="alert" style={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '50px 40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid rgba(220,53,69,0.3)'
          }}>
            <div className="mb-4">
              <i className="bi bi-exclamation-triangle-fill" style={{ 
                fontSize: '4rem',
                color: '#dc3545',
                filter: 'drop-shadow(0 4px 12px rgba(220,53,69,0.3))'
              }}></i>
            </div>
            <h4 className="fw-bold mb-3" style={{ color: '#dc3545' }}>Oops! Something went wrong</h4>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={handleRetry} className="btn btn-lg" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 40px',
              borderRadius: '12px',
              fontWeight: '600',
              boxShadow: '0 8px 20px rgba(102,126,234,0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(102,126,234,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102,126,234,0.4)';
            }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </button>
          </div>
        )}

        {/* Places Grid - Modern Design */}
        {!isLoading && !error && (
          <>
            {displayPlaces && displayPlaces.length > 0 ? (
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                borderRadius: '24px',
                padding: '40px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.5)'
              }}>
                <div className="mb-4 pb-3" style={{ borderBottom: '2px solid rgba(102,126,234,0.2)' }}>
                  <h4 style={{ 
                    color: '#2c3e50',
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span className="badge" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '1.2rem',
                      padding: '8px 20px',
                      borderRadius: '12px'
                    }}>
                      {filteredPlaces.length}
                    </span>
                    {filterQuery ? (
                      <>Destinations matching <span style={{ color: '#667eea' }}>"{filterQuery}"</span></>
                    ) : showNearby ? (
                      <>Destinations nearby</>
                    ) : (
                      <>Available Destinations</>
                    )}
                  </h4>
                </div>
                
                {/* Grid dengan animasi */}
                <div className="row g-4">
                  {displayPlaces.map((place, index) => (
                    <div 
                      key={place.id || index} 
                      className="col-md-6 col-lg-4"
                      style={{
                        animation: `fadeInUp 0.6s ease forwards ${index * 0.1}s`,
                        opacity: 0
                      }}
                    >
                      <PlaceCard place={place} />
                    </div>
                  ))}
                </div>
                
                {/* Show All / Show Less Button - Modern Style */}
                {filteredPlaces.length > 6 && (
                  <div className="text-center mt-5 pt-4" style={{ 
                    borderTop: '2px solid rgba(102,126,234,0.2)'
                  }}>
                    {!showAll && (
                      <p className="text-muted mb-4" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                        <i className="bi bi-plus-circle me-2"></i>
                        {filteredPlaces.length - 6} more amazing destinations waiting for you
                      </p>
                    )}
                    <button 
                      onClick={toggleShowAll}
                      className="btn btn-lg px-5"
                      style={{
                        background: showAll 
                          ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '14px 50px',
                        borderRadius: '16px',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        boxShadow: '0 10px 30px rgba(102,126,234,0.4)',
                        transition: 'all 0.4s ease',
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(102,126,234,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(102,126,234,0.4)';
                      }}
                    >
                      {showAll ? (
                        <>
                          <i className="bi bi-chevron-up me-2"></i> 
                          Show Less
                        </>
                      ) : (
                        <>
                          <i className="bi bi-chevron-down me-2"></i> 
                          Show All {filteredPlaces.length} Destinations
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : filterQuery ? (
              // No results from filter
              <div className="text-center py-5" style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                borderRadius: '24px',
                padding: '60px 40px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div className="mb-4">
                  <i className="bi bi-search-heart" style={{ 
                    fontSize: '5rem',
                    color: '#667eea',
                    filter: 'drop-shadow(0 4px 12px rgba(102,126,234,0.3))'
                  }}></i>
                </div>
                <h3 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
                  No destinations found for "{filterQuery}"
                </h3>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                  Try different keywords or clear the filter to see all destinations
                </p>
              </div>
            ) : (
              <div className="text-center py-5" style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                borderRadius: '24px',
                padding: '60px 40px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div className="mb-4">
                  <i className="bi bi-compass" style={{ 
                    fontSize: '5rem',
                    color: '#667eea',
                    filter: 'drop-shadow(0 4px 12px rgba(102,126,234,0.3))'
                  }}></i>
                </div>
                <h3 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
                  {showNearby 
                    ? 'No destinations found nearby' 
                    : 'No places found'}
                </h3>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                  {showNearby 
                    ? 'Try selecting a different location on the map below' 
                    : 'Start your adventure by exploring the map!'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Map Section - Modern Design */}
        <div className="mt-5" style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.5)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '40px' }}>
            <div className="mb-4 pb-3" style={{ borderBottom: '2px solid rgba(102,126,234,0.2)' }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(102,126,234,0.4)'
                  }}>
                    <i className="bi bi-map" style={{ 
                      fontSize: '1.8rem',
                      color: 'white'
                    }}></i>
                  </div>
                  <div>
                    <h5 className="mb-1" style={{ 
                      color: '#2c3e50',
                      fontWeight: '700',
                      fontSize: '1.5rem'
                    }}>
                      Find Destinations Near You
                    </h5>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
                      Click on the map to discover destinations within 50km radius
                    </p>
                  </div>
                </div>
                
                {showNearby && (
                  <button
                    onClick={handleShowAllPlaces}
                    className="btn px-4 py-2"
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxShadow: '0 6px 20px rgba(245,87,108,0.3)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(245,87,108,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,87,108,0.3)';
                    }}
                  >
                    <i className="bi bi-arrow-left"></i>
                    Back to All Destinations
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ 
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: '3px solid rgba(102,126,234,0.2)'
            }}>
              <MapSelector 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                mapCenter={mapCenter}
                places={showNearby ? nearbyPlaces : []}
              />
            </div>
            
            {showNearby && (
              <div className="mt-4 p-4 text-center" style={{
                background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                borderRadius: '16px',
                border: '2px dashed rgba(102,126,234,0.3)'
              }}>
                <i className="bi bi-info-circle me-2" style={{ color: '#667eea', fontSize: '1.2rem' }}></i>
                <span style={{ color: '#2c3e50', fontWeight: '500', fontSize: '1.05rem' }}>
                  Showing destinations within <strong style={{ color: '#667eea' }}>50km</strong> of your selected location
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}