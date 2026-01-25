/**
 * Places Slice - Redux State Management untuk Data Tempat Wisata
 * 
 * Mengelola state untuk semua operasi terkait places (tempat wisata):
 * - Fetch semua places dari database (public)
 * - Fetch detail place by ID
 * - Search places by location (Geoapify API)
 * - Fetch nearby places by coordinates (Geoapify API)
 * - Get AI recommendation untuk place (Google Gemini)
 * 
 * State Structure:
 * - places: Array semua places dari database
 * - currentPlace: Object detail place yang sedang dilihat
 * - searchResults: Array hasil pencarian dari Geoapify
 * - nearbyPlaces: Array places terdekat (persist di localStorage)
 * - aiRecommendation: String rekomendasi AI dari Gemini
 * - mapCenter: Object {lat, lon} untuk center map (persist)
 * - showChatbotResults: Boolean untuk trigger tampilan hasil chatbot
 * - filterQuery: String global filter dari Navbar
 * - isLoading: Boolean loading state
 * - error: String error message
 * 
 * Persistence:
 * - nearbyPlaces & mapCenter disimpan di localStorage
 * - Auto-restore saat app reload untuk better UX
 * 
 * @module placesSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Base URL API dari environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Helper: Get Authentication Header
 * 
 * Ambil token dari localStorage dan format sebagai Bearer token.
 * 
 * @returns {Object} Object dengan Authorization header (atau empty)
 * @example
 * getAuthHeader() // { Authorization: 'Bearer eyJhbGc...' }
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Async Thunk: Fetch All Places
 * 
 * Fetch semua places dari database (public endpoint - no auth required).
 * 
 * Flow:
 * 1. GET request ke /places
 * 2. Backend return array semua places dari database
 * 3. Frontend update Redux state dengan data
 * 
 * Use Cases:
 * - Homepage untuk tampilkan semua places
 * - Cards untuk browse semua destinations
 * 
 * @async
 * @returns {Promise<Array>} Array of place objects
 * @throws {string} Error message jika gagal fetch
 */
export const fetchPlaces = createAsyncThunk(
  'places/fetchPlaces',
  async (_, { rejectWithValue }) => {
    try {
      // Public endpoint - tidak perlu authentication
      const response = await axios.get(`${API_URL}/places`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch places');
    }
  }
);

/**
 * Async Thunk: Fetch Place by ID
 * 
 * Fetch detail lengkap place berdasarkan ID.
 * 
 * Flow:
 * 1. GET request ke /places/:id
 * 2. Backend return detail place (name, location, category, images, dll)
 * 3. Frontend simpan di currentPlace untuk tampilkan di PlaceDetails page
 * 
 * Use Cases:
 * - PlaceDetails page saat user klik "View Details"
 * - Modal untuk tampilkan detail place
 * 
 * @async
 * @param {number} id - Place ID
 * @returns {Promise<Object>} Place detail object
 * @throws {string} Error message jika place not found
 */
export const fetchPlaceById = createAsyncThunk(
  'places/fetchPlaceById',
  async (id, { rejectWithValue }) => {
    try {
      // Public endpoint - tidak perlu authentication
      const response = await axios.get(`${API_URL}/places/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch place details');
    }
  }
);

/**
 * Async Thunk: Search Places by Location
 * 
 * Search places menggunakan Geoapify Places API berdasarkan query string.
 * 
 * Flow:
 * 1. User ketik query di search bar (contoh: "Bali", "Paris", "Tokyo")
 * 2. GET request ke /geoapify/search dengan location parameter
 * 3. Backend forward request ke Geoapify API
 * 4. Geoapify return list places yang match dengan query
 * 5. Frontend update searchResults dan tampilkan di SearchResults page
 * 
 * Features:
 * - Real-time search saat user ketik
 * - Autocomplete untuk suggest locations
 * - Support untuk city names, addresses, landmarks
 * 
 * @async
 * @param {string} searchQuery - Location query (city, address, landmark)
 * @returns {Promise<Array>} Array of place objects dari Geoapify
 * @throws {string} Error message jika search gagal
 */
export const searchPlacesByLocation = createAsyncThunk(
  'places/searchByLocation',
  async (searchQuery, { rejectWithValue }) => {
    try {
      // Requires authentication
      const response = await axios.get(`${API_URL}/geoapify/search`, {
        params: { location: searchQuery },
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search places');
    }
  }
);

/**
 * Async Thunk: Fetch Nearby Places
 * 
 * Fetch places terdekat berdasarkan koordinat geografis (latitude & longitude).
 * 
 * Flow:
 * 1. User pilih lokasi di map atau allow geolocation
 * 2. App ambil koordinat (lat, lon)
 * 3. GET request ke /geoapify/nearby dengan coordinates & radius
 * 4. Backend forward ke Geoapify Places API
 * 5. Geoapify return list attractions dalam radius tertentu
 * 6. Frontend update nearbyPlaces dan tampilkan di map/cards
 * 7. Save ke localStorage untuk persist last search
 * 
 * Use Cases:
 * - MapSelector untuk tampilkan places terdekat saat select location
 * - "Near Me" feature untuk tampilkan places di sekitar user
 * - ChatBot untuk suggest places based on location
 * 
 * @async
 * @param {Object} params - Search parameters
 * @param {number} params.lat - Latitude koordinat
 * @param {number} params.lon - Longitude koordinat
 * @param {number} [params.radius=50000] - Radius pencarian dalam meter (default 50km)
 * @returns {Promise<Array>} Array of nearby attraction objects
 * @throws {string} Error message jika fetch gagal
 */
export const fetchNearbyPlaces = createAsyncThunk(
  'places/fetchNearby',
  async ({ lat, lon, radius = 50000 }, { rejectWithValue }) => {
    try {
      // Requires authentication
      const response = await axios.get(`${API_URL}/geoapify/nearby`, {
        params: { lat, lon, radius },
        headers: getAuthHeader()
      });
      // Backend returns { attractions: [...] }
      return response.data.attractions || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nearby places');
    }
  }
);

/**
 * Async Thunk: Get AI Recommendation
 * 
 * Get personalized AI recommendation untuk place dari Google Gemini AI.
 * 
 * Flow:
 * 1. User buka PlaceDetails page
 * 2. POST request ke /gemini/recommend dengan placeId
 * 3. Backend fetch place data dari database
 * 4. Backend send data ke Google Gemini API dengan prompt
 * 5. Gemini analyze place data dan generate recommendation
 * 6. Backend return AI-generated text
 * 7. Frontend tampilkan recommendation di PlaceDetails
 * 
 * Recommendation includes:
 * - Why user should visit this place
 * - Best time to visit
 * - What to expect
 * - Similar places user might like
 * 
 * Use Cases:
 * - PlaceDetails page untuk provide AI insights
 * - Enhance user decision making
 * - Personalized travel suggestions
 * 
 * @async
 * @param {number} placeId - Place ID untuk generate recommendation
 * @returns {Promise<Object>} AI recommendation object
 * @throws {string} Error message jika AI call gagal
 */
export const getAIRecommendation = createAsyncThunk(
  'places/getAIRecommendation',
  async (placeId, { rejectWithValue }) => {
    try {
      // Requires authentication
      const response = await axios.post(`${API_URL}/gemini/recommend`, 
        { placeId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get AI recommendation');
    }
  }
);

/**
 * Initial State untuk Places Slice
 * 
 * Restore nearbyPlaces & mapCenter dari localStorage jika ada.
 * Ini memungkinkan user untuk kembali ke last search results setelah refresh.
 * 
 * State Properties:
 * - places: Array semua places dari database (public)
 * - currentPlace: Object detail place yang sedang dilihat
 * - searchResults: Array hasil search dari Geoapify
 * - nearbyPlaces: Array places terdekat (persisted)
 * - aiRecommendation: String AI-generated recommendation
 * - mapCenter: {lat, lon} untuk center map (persisted)
 * - showChatbotResults: Boolean trigger untuk tampilkan hasil chatbot
 * - filterQuery: String untuk filter places secara local
 * - isLoading: Boolean loading state
 * - error: String error message
 */
const initialState = {
  places: [],
  currentPlace: null,
  searchResults: [],
  nearbyPlaces: JSON.parse(localStorage.getItem('lastSearchResults') || '[]'), // Persist last search
  aiRecommendation: null,
  mapCenter: JSON.parse(localStorage.getItem('lastMapCenter') || 'null'), // Persist map position
  showChatbotResults: false,
  filterQuery: '',
  isLoading: false,
  error: null,
};

/**
 * Places Slice
 * 
 * Redux slice untuk manage places state & operations.
 * Includes:
 * - Sync reducers untuk manual state updates
 * - Async reducers untuk handle API calls
 */
const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    /**
     * Clear Error
     * Reset error message ke null.
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * Clear Current Place
     * Reset currentPlace & aiRecommendation ke null.
     * Dipanggil saat user navigate away dari PlaceDetails.
     */
    clearCurrentPlace: (state) => {
      state.currentPlace = null;
      state.aiRecommendation = null;
    },
    
    /**
     * Clear Search Results
     * Reset searchResults ke empty array.
     * Dipanggil saat user clear search atau navigate away.
     */
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    /**
     * Set Places from Chatbot
     * 
     * Update nearbyPlaces & mapCenter dari hasil chatbot.
     * Set showChatbotResults flag untuk trigger Home.jsx.
     * Persist ke localStorage untuk navigation persistence.
     * 
     * Flow:
     * 1. ChatBot get places dari Geoapify
     * 2. ChatBot dispatch setPlacesFromChatbot dengan places & mapCenter
     * 3. Reducer update state & localStorage
     * 4. Home.jsx detect showChatbotResults=true
     * 5. Home.jsx scroll ke map section
     * 
     * @param {Object} action.payload - Chatbot results
     * @param {Array} action.payload.places - Array of place objects
     * @param {Object} action.payload.mapCenter - {lat, lon} coordinates
     */
    setPlacesFromChatbot: (state, action) => {
      const { places, mapCenter } = action.payload;
      state.nearbyPlaces = places || [];
      state.mapCenter = mapCenter || null;
      state.showChatbotResults = true;
      
      // Persist untuk retain results after navigation
      localStorage.setItem('lastSearchResults', JSON.stringify(places || []));
      localStorage.setItem('lastMapCenter', JSON.stringify(mapCenter || null));
    },
    
    /**
     * Set Map Center
     * Update map center coordinates.
     * Dipanggil saat user pilih location di MapSelector.
     */
    setMapCenter: (state, action) => {
      state.mapCenter = action.payload;
    },
    
    /**
     * Reset Chatbot Results
     * Reset showChatbotResults flag ke false.
     * Dipanggil setelah Home.jsx selesai scroll ke map.
     */
    resetChatbotResults: (state) => {
      state.showChatbotResults = false;
    },
    
    /**
     * Clear Nearby Places
     * Clear nearbyPlaces, mapCenter, dan localStorage.
     * Dipanggil saat user clear last search.
     */
    clearNearbyPlaces: (state) => {
      state.nearbyPlaces = [];
      state.mapCenter = null;
      localStorage.removeItem('lastSearchResults');
      localStorage.removeItem('lastMapCenter');
    },
    
    /**
     * Set Filter Query
     * Update global filter query dari Navbar.
     * Digunakan untuk filter places secara local di Home.jsx.
     */
    setFilterQuery: (state, action) => {
      state.filterQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all places
      .addCase(fetchPlaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.places = action.payload;
      })
      .addCase(fetchPlaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch place by ID
      .addCase(fetchPlaceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlaceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPlace = action.payload;
      })
      .addCase(fetchPlaceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Search places by location
      .addCase(searchPlacesByLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchPlacesByLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchPlacesByLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch nearby places
      .addCase(fetchNearbyPlaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyPlaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyPlaces = action.payload;
      })
      .addCase(fetchNearbyPlaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get AI recommendation
      .addCase(getAIRecommendation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAIRecommendation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.aiRecommendation = action.payload;
      })
      .addCase(getAIRecommendation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentPlace, clearSearchResults, setPlacesFromChatbot, setMapCenter, resetChatbotResults, clearNearbyPlaces, setFilterQuery } = placesSlice.actions;
export default placesSlice.reducer;
