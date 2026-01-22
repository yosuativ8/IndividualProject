// Redux Store Configuration
// Store adalah tempat penyimpanan state global aplikasi
// Menggunakan Redux Toolkit untuk simplifikasi konfigurasi

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import placesReducer from './slices/placesSlice';
import wishlistReducer from './slices/wishlistSlice';

// Configure store dengan semua reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,       // State untuk authentication user
    places: placesReducer,   // State untuk data tempat wisata
    wishlist: wishlistReducer // State untuk wishlist/destinations user
  },
});

export default store;
