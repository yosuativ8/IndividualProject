// Places Slice - State management untuk data tempat wisata
// Mengelola state untuk daftar places, detail place, search, dan nearby places
// Data di-fetch dari backend API dan disimpan di Redux store

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function untuk get token dari localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async thunk untuk fetch semua places (public)
export const fetchPlaces = createAsyncThunk(
  'places/fetchPlaces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/places`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch places');
    }
  }
);

// Async thunk untuk fetch detail place by ID
export const fetchPlaceById = createAsyncThunk(
  'places/fetchPlaceById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/places/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch place details');
    }
  }
);

// Async thunk untuk search places by location (Geoapify)
export const searchPlacesByLocation = createAsyncThunk(
  'places/searchByLocation',
  async (searchQuery, { rejectWithValue }) => {
    try {
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

// Async thunk untuk fetch nearby places (Geoapify)
export const fetchNearbyPlaces = createAsyncThunk(
  'places/fetchNearby',
  async ({ lat, lon, radius = 50000 }, { rejectWithValue }) => {
    try {
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

// Async thunk untuk get AI recommendation dari Gemini
export const getAIRecommendation = createAsyncThunk(
  'places/getAIRecommendation',
  async (placeId, { rejectWithValue }) => {
    try {
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

// Initial state untuk places
const initialState = {
  places: [],              // Daftar semua places
  currentPlace: null,      // Detail place yang sedang dilihat
  searchResults: [],       // Hasil pencarian
  nearbyPlaces: [],        // Places terdekat
  aiRecommendation: null,  // Rekomendasi AI untuk place
  isLoading: false,
  error: null,
};

// Create places slice
const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    // Action untuk clear error
    clearError: (state) => {
      state.error = null;
    },
    // Action untuk clear current place
    clearCurrentPlace: (state) => {
      state.currentPlace = null;
      state.aiRecommendation = null;
    },
    // Action untuk clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
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

export const { clearError, clearCurrentPlace, clearSearchResults } = placesSlice.actions;
export default placesSlice.reducer;
