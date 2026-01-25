/**
 * Redux Store Configuration
 * 
 * Store adalah tempat penyimpanan state global aplikasi.
 * Menggunakan Redux Toolkit configureStore untuk simplifikasi konfigurasi.
 * 
 * Store Structure:
 * - auth: Authentication state (user, token, isAuthenticated)
 * - places: Places state (places, currentPlace, nearbyPlaces, searchResults)
 * - wishlist: Wishlist state (items - user saved places)
 * 
 * Redux Benefits:
 * - Centralized state management
 * - State accessible dari semua components
 * - Predictable state updates via actions
 * - Easy debugging dengan Redux DevTools
 * - State persistence via localStorage
 * 
 * Usage in Components:
 * - useSelector: Read state dari store
 * - useDispatch: Dispatch actions untuk update state
 * 
 * Example:
 * ```jsx
 * import { useSelector, useDispatch } from 'react-redux';
 * import { login } from './store/slices/authSlice';
 * 
 * function MyComponent() {
 *   const user = useSelector(state => state.auth.user);
 *   const dispatch = useDispatch();
 *   
 *   const handleLogin = (credentials) => {
 *     dispatch(login(credentials));
 *   };
 * }
 * ```
 * 
 * @module store
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import placesReducer from './slices/placesSlice';
import wishlistReducer from './slices/wishlistSlice';

/**
 * Configure Redux Store
 * 
 * configureStore automatically includes:
 * - Redux DevTools Extension integration
 * - Middleware untuk serialization checks
 * - Thunk middleware untuk async actions
 * 
 * Reducers:
 * - auth: Manage authentication state (login, register, logout)
 * - places: Manage places data (fetch, search, nearby, AI recommendations)
 * - wishlist: Manage user wishlist (add, remove, fetch)
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,       // State untuk authentication user
    places: placesReducer,   // State untuk data tempat wisata
    wishlist: wishlistReducer // State untuk wishlist/destinations user
  },
});

/**
 * Export Store sebagai default
 * 
 * Store ini akan di-wrap dengan Provider di main.jsx:
 * ```jsx
 * <Provider store={store}>
 *   <App />
 * </Provider>
 * ```
 */
export default store;
