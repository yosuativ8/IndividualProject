/**
 * Wishlist Slice - Redux State Management untuk User Wishlist
 * 
 * Mengelola state untuk wishlist (user destinations):
 * - Fetch user wishlist
 * - Add place to wishlist
 * - Remove place from wishlist
 * 
 * State Structure:
 * - items: Array wishlist items (dengan Place data)
 * - isLoading: Boolean loading state
 * - error: String error message
 * 
 * Authentication Required:
 * - Semua operations memerlukan JWT token
 * - Token diambil dari localStorage dan dikirim via Authorization header
 * 
 * @module wishlistSlice
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
 * Async Thunk: Fetch Wishlist
 * 
 * Fetch semua wishlist items milik user yang sedang login.
 * 
 * Flow:
 * 1. Check jika token exists di localStorage
 * 2. Jika tidak ada token → return empty array (not authenticated)
 * 3. Jika ada token → GET request ke /wishlist dengan Authorization header
 * 4. Backend verify token dengan JWT middleware
 * 5. Backend fetch UserDestinations by userId (include Place data)
 * 6. Backend return array wishlist items
 * 7. Frontend update Redux state dengan items
 * 
 * Use Cases:
 * - Wishlist page untuk tampilkan semua saved places
 * - Homepage untuk check apakah place sudah di wishlist (heart icon)
 * - Auto-fetch saat user login
 * 
 * @async
 * @returns {Promise<Array>} Array of wishlist item objects (dengan Place data)
 * @throws {string} Error message jika fetch gagal
 */
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      // Early return jika user belum login
      if (!token) {
        return [];
      }
      
      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: getAuthHeader() // JWT token untuk authentication
      });
      
      console.log('Wishlist fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch wishlist error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

/**
 * Async Thunk: Add to Wishlist
 * 
 * Add place ke wishlist user.
 * 
 * Flow:
 * 1. User klik heart icon di PlaceCard atau PlaceDetails
 * 2. POST request ke /wishlist dengan placeId & Authorization header
 * 3. Backend verify token dengan JWT middleware
 * 4. Backend extract userId dari token payload
 * 5. Backend check duplicate: jika sudah ada → error
 * 6. Backend create new UserDestination record
 * 7. Backend return created record (dengan Place data)
 * 8. Frontend push item ke wishlist items array
 * 9. UI update heart icon ke filled
 * 
 * Constraints:
 * - User harus login (requires token)
 * - PlaceId harus valid & exist di database
 * - Tidak boleh duplikat (1 place per user)
 * 
 * @async
 * @param {number} placeId - Place ID untuk add ke wishlist
 * @returns {Promise<Object>} Created wishlist item object
 * @throws {string} Error message (duplicate, place not found, dll)
 */
export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (placeId, { rejectWithValue }) => {
    try {
      console.log('Adding to wishlist, placeId:', placeId);
      
      const response = await axios.post(
        `${API_URL}/wishlist`,
        { placeId }, // Request body
        { headers: getAuthHeader() } // JWT token untuk authentication
      );
      
      console.log('Add to wishlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Add to wishlist error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

/**
 * Async Thunk: Remove from Wishlist
 * 
 * Remove place dari wishlist user.
 * 
 * Flow:
 * 1. User klik heart icon (unfavorite) di PlaceCard atau Wishlist page
 * 2. DELETE request ke /wishlist/:id dengan Authorization header
 * 3. Backend verify token dengan JWT middleware
 * 4. Backend check authorization: jika bukan pemilik → error
 * 5. Backend delete UserDestination record
 * 6. Backend return success response
 * 7. Frontend filter out deleted item dari wishlist array
 * 8. UI update heart icon ke outline
 * 
 * Use Cases:
 * - Wishlist page untuk remove saved places
 * - Homepage untuk unfavorite dari cards
 * - PlaceDetails untuk remove from wishlist
 * 
 * @async
 * @param {number} destinationId - UserDestination ID (bukan placeId!)
 * @returns {Promise<number>} Deleted destinationId
 * @throws {string} Error message (not found, unauthorized, dll)
 */
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (destinationId, { rejectWithValue }) => {
    try {
      // DELETE request dengan destinationId di URL
      await axios.delete(`${API_URL}/wishlist/${destinationId}`, {
        headers: getAuthHeader() // JWT token untuk authentication & authorization
      });
      
      // Return destinationId untuk filter di reducer
      return destinationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

/**
 * Initial State untuk Wishlist Slice
 * 
 * State Properties:
 * - items: Array wishlist items (UserDestinations dengan Place data)
 * - isLoading: Boolean loading state
 * - error: String error message
 */
const initialState = {
  items: [], // Start with empty array, akan di-fetch saat user login
  isLoading: false,
  error: null,
};

/**
 * Wishlist Slice
 * 
 * Redux slice untuk manage wishlist state & operations.
 * Includes:
 * - Sync reducers untuk manual state updates
 * - Async reducers untuk handle API calls
 */
const wishlistSlice = createSlice({
  name: 'wishlist',
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
     * Clear Wishlist
     * 
     * Reset wishlist items ke empty array.
     * Dipanggil saat user logout untuk clear user data.
     */
    clearWishlist: (state) => {
      state.items = [];
    },
  },
  /**
   * Extra Reducers
   * 
   * Handle state changes untuk async thunks.
   * Setiap thunk memiliki 3 lifecycle:
   * - pending: Request sedang berjalan (loading state)
   * - fulfilled: Request berhasil (update state dengan data)
   * - rejected: Request gagal (update error state)
   */
  extraReducers: (builder) => {
    builder
      // ===== FETCH WISHLIST =====
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload; // Array of wishlist items
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ===== ADD TO WISHLIST =====
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload); // Add new item to array
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ===== REMOVE FROM WISHLIST =====
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        // Filter out deleted item by ID
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

/**
 * Export Actions
 * 
 * Sync actions yang bisa dipanggil dari components:
 * - clearError: Reset error message
 * - clearWishlist: Clear wishlist saat logout
 */
export const { clearError, clearWishlist } = wishlistSlice.actions;

/**
 * Export Reducer
 * 
 * Default export untuk configure dalam Redux store.
 */
export default wishlistSlice.reducer;
