// Wishlist Slice - State management untuk wishlist/user destinations
// Mengelola state untuk user destinations (wishlist) user
// User bisa add/remove destinations (requires authentication)

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function untuk get token dari localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async thunk untuk fetch user wishlist
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Cek token untuk memastikan user terautentikasi
      if (!token) {
        return [];
      }
      const response = await axios.get(`${API_URL}/wishlist`, { // Fetch wishlist dari backend
        headers: getAuthHeader() // Sertakan header Authorization dengan token
      });
      console.log('Wishlist fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch wishlist error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// Async thunk untuk add place to wishlist
export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (placeId, { rejectWithValue }) => {
    try {
      console.log('Adding to wishlist, placeId:', placeId);
      const response = await axios.post(
        `${API_URL}/wishlist`,
        { placeId },
        { headers: getAuthHeader() }
      );
      console.log('Add to wishlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Add to wishlist error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

// Async thunk untuk remove place from wishlist
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (destinationId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/wishlist/${destinationId}`, {
        headers: getAuthHeader() // Sertakan header Authorization dengan token
      });
      return destinationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

// Initial state untuk wishlist
const initialState = {
  items: [],          // Daftar wishlist items
  isLoading: false,
  error: null,
};

// Create wishlist slice
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // Action untuk clear error
    clearError: (state) => {
      state.error = null;
    },
    // Action untuk clear wishlist (saat logout)
    clearWishlist: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
