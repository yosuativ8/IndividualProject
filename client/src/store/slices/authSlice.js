/**
 * Auth Slice - Redux State Management untuk Authentication
 * 
 * Mengelola state untuk semua operasi autentikasi:
 * - User registration (email/password & Google OAuth)
 * - User login (email/password & Google OAuth)
 * - User logout
 * - Session persistence (localStorage)
 * 
 * State Structure:
 * - user: Object berisi user data (id, email)
 * - token: String JWT access token
 * - isAuthenticated: Boolean untuk check login status
 * - isLoading: Boolean untuk loading state saat API call
 * - error: String berisi error message (jika ada)
 * 
 * Persistence:
 * - Token & user data disimpan di localStorage
 * - Auto-restore state dari localStorage saat app reload
 * 
 * @module authSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Base URL API dari environment variable atau fallback ke localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Async Thunk: Register User
 * 
 * Register user baru dengan email & password.
 * 
 * Flow:
 * 1. POST request ke /auth/register dengan userData
 * 2. Backend validate & hash password
 * 3. Backend return access_token & user data
 * 4. Save token & user ke localStorage
 * 5. Return data untuk update Redux state
 * 
 * @async
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password (min 6 chars)
 * @returns {Promise<Object>} Response data (access_token, user)
 * @throws {string} Error message dari backend
 */
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      // Kirim POST request ke endpoint register
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      // Persist token & user data ke localStorage untuk session persistence
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      // Tangkap error dari backend (email sudah terdaftar, password terlalu pendek, dll)
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

/**
 * Async Thunk: Login User
 * 
 * Login user dengan email & password.
 * 
 * Flow:
 * 1. POST request ke /auth/login dengan credentials
 * 2. Backend verify email & password dengan bcrypt
 * 3. Backend return access_token & user data
 * 4. Save token & user ke localStorage
 * 5. Return data untuk update Redux state
 * 
 * @async
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Response data (access_token, user)
 * @throws {string} Error message dari backend
 */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Kirim POST request ke endpoint login
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      // Persist token & user data ke localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      // Tangkap error dari backend (email tidak ditemukan, password salah, dll)
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

/**
 * Async Thunk: Google Register
 * 
 * Register user baru menggunakan Google OAuth.
 * 
 * Flow:
 * 1. User klik Google Sign-Up button
 * 2. Google OAuth popup muncul
 * 3. User pilih Google account
 * 4. Google return id_token (JWT)
 * 5. Send id_token ke backend /auth/google-register
 * 6. Backend verify token dengan Google API
 * 7. Backend create user baru jika email belum terdaftar
 * 8. Backend return access_token & user data
 * 9. Save ke localStorage
 * 
 * @async
 * @param {string} googleToken - Google ID token (JWT dari OAuth)
 * @returns {Promise<Object>} Response data (access_token, user)
 * @throws {string} Error message (jika email sudah terdaftar)
 */
export const googleRegister = createAsyncThunk(
  'auth/googleRegister',
  async (googleToken, { rejectWithValue }) => {
    try {
      // Kirim Google ID token ke backend untuk verification
      const response = await axios.post(`${API_URL}/auth/google-register`, {
        id_token: googleToken
      });
      
      // Persist token & user data ke localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      // Error: Email sudah terdaftar atau token invalid
      return rejectWithValue(error.response?.data?.message || 'Google registration failed');
    }
  }
);

/**
 * Async Thunk: Google Login
 * 
 * Login user dengan akun Google yang sudah terdaftar.
 * 
 * Flow:
 * 1. User klik Google Sign-In button
 * 2. Google OAuth popup muncul
 * 3. User pilih Google account
 * 4. Google return id_token (JWT)
 * 5. Send id_token ke backend /auth/google-login
 * 6. Backend verify token dengan Google API
 * 7. Backend check jika email sudah terdaftar
 * 8. Backend return access_token & user data
 * 9. Save ke localStorage
 * 
 * @async
 * @param {string} googleToken - Google ID token (JWT dari OAuth)
 * @returns {Promise<Object>} Response data (access_token, user)
 * @throws {string} Error message (jika email belum terdaftar)
 */
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (googleToken, { rejectWithValue }) => {
    try {
      // Kirim Google ID token ke backend untuk verification
      const response = await axios.post(`${API_URL}/auth/google-login`, {
        id_token: googleToken
      });
      
      // Persist token & user data ke localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      // Error: Email belum terdaftar atau token invalid
      return rejectWithValue(error.response?.data?.message || 'Google login failed');
    }
  }
);

/**
 * Async Thunk: Google Sign-In (Unified)
 * 
 * Unified endpoint untuk login/register dengan Google (backward compatibility).
 * Backend automatically check apakah email sudah terdaftar atau belum:
 * - Jika sudah: Login existing user
 * - Jika belum: Register user baru
 * 
 * Flow:
 * 1. User klik Google Sign-In button
 * 2. Google OAuth popup muncul
 * 3. User pilih Google account
 * 4. Google return id_token (JWT)
 * 5. Send id_token ke backend /auth/google-sign-in
 * 6. Backend verify token dengan Google API
 * 7. Backend check database:
 *    - Email exists → Login user
 *    - Email not exists → Create new user
 * 8. Backend return access_token & user data
 * 9. Save ke localStorage
 * 
 * @async
 * @param {string} googleToken - Google ID token (JWT dari OAuth)
 * @returns {Promise<Object>} Response data (access_token, user)
 * @throws {string} Error message (jika token invalid)
 */
export const googleSignIn = createAsyncThunk(
  'auth/googleSignIn',
  async (googleToken, { rejectWithValue }) => {
    try {
      // Kirim Google ID token ke unified endpoint
      const response = await axios.post(`${API_URL}/auth/google-sign-in`, {
        id_token: googleToken
      });
      
      // Persist token & user data ke localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      // Error: Token invalid atau network error
      return rejectWithValue(error.response?.data?.message || 'Google sign-in failed');
    }
  }
);

/**
 * Initial State untuk Auth Slice
 * 
 * Restore state dari localStorage jika ada:
 * - user: Parse JSON dari localStorage
 * - token: Ambil string token dari localStorage
 * - isAuthenticated: Auto-set true jika token exists
 * 
 * Benefits:
 * - User tetap login setelah refresh page
 * - Tidak perlu login ulang setiap kali buka app
 * - Session persist across browser tabs
 */
const initialState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'), // Double negation untuk convert ke boolean
};

/**
 * Auth Slice
 * 
 * Redux slice untuk manage authentication state.
 * Includes:
 * - Sync reducers untuk logout & clearError
 * - Async reducers untuk handle API calls
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Logout Action
     * 
     * Clear semua auth data dari state & localStorage:
     * 1. Reset user & token ke null
     * 2. Set isAuthenticated ke false
     * 3. Remove data dari localStorage
     * 4. User akan redirect ke login page
     * 
     * @param {Object} state - Current auth state
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear localStorage untuk prevent auto-login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    /**
     * Clear Error Action
     * 
     * Reset error message ke null.
     * Dipanggil saat:
     * - User close error notification
     * - User retry action setelah error
     * 
     * @param {Object} state - Current auth state
     */
    clearError: (state) => {
      state.error = null;
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
      // ===== REGISTER REDUCERS =====
      // Pending: Show loading spinner
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear previous errors
      })
      // Fulfilled: Save user data & set authenticated
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user; // User object dari backend
        state.token = action.payload.access_token; // JWT token
        state.isAuthenticated = true; // User now logged in
      })
      // Rejected: Show error message
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload; // Error message dari backend
      })
      
      // ===== LOGIN REDUCERS =====
      // Pending: Show loading spinner
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Fulfilled: Save user data & set authenticated
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        console.log('Login successful, user:', action.payload.user);
      })
      // Rejected: Show error message
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ===== GOOGLE REGISTER REDUCERS =====
      // Pending: Show loading spinner
      .addCase(googleRegister.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Fulfilled: Save user data & set authenticated
      .addCase(googleRegister.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
      })
      // Rejected: Show error (email already exists)
      .addCase(googleRegister.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ===== GOOGLE LOGIN REDUCERS =====
      // Pending: Show loading spinner
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Fulfilled: Save user data & set authenticated
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
      })
      // Rejected: Show error (email not registered)
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ===== GOOGLE SIGN-IN REDUCERS (Unified) =====
      // Pending: Show loading spinner
      .addCase(googleSignIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Fulfilled: Save user data & set authenticated (auto login/register)
      .addCase(googleSignIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
      })
      // Rejected: Show error (token invalid)
      .addCase(googleSignIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

/**
 * Export Actions
 * 
 * Sync actions yang bisa dipanggil langsung dari components:
 * - logout: Clear auth state & localStorage
 * - clearError: Reset error message
 */
export const { logout, clearError } = authSlice.actions;

/**
 * Export Reducer
 * 
 * Default export untuk configure dalam Redux store.
 * Reducer ini handle semua auth state updates.
 */
export default authSlice.reducer;
