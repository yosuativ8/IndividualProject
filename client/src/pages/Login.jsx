/**
 * Login Page Component
 * 
 * Halaman login untuk user dengan dua metode autentikasi:
 * 1. Email & Password (traditional authentication)
 * 2. Google Sign-In (OAuth 2.0)
 * 
 * Features:
 * - Form validation (email format, required fields)
 * - Loading state saat submit
 * - Error handling dengan alert display
 * - Integration dengan Google OAuth
 * - Link ke Register page
 * - Browse as Guest option
 * 
 * User Flow:
 * - Input email & password → Submit → Login → Redirect to Home
 * - Atau klik Google Sign-In → OAuth popup → Auto login → Redirect to Home
 * - Error → Display error message di alert
 * 
 * Access: Public (tidak perlu login untuk akses page ini)
 * 
 * @component
 * @example
 * <Route path="/login" element={<Login />} />
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, googleLogin } from '../store/slices/authSlice';
import { fetchWishlist } from '../store/slices/wishlistSlice';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  // Local state untuk form data (controlled components)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state untuk loading & error
  const { isLoading, error } = useSelector((state) => state.auth);

  /**
   * Handle Input Change
   * 
   * Update formData state setiap kali user mengetik di input field.
   * Menggunakan computed property name [e.target.name] untuk dynamic key.
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value // Dynamic key: 'email' atau 'password'
    });
  };

  /**
   * Handle Form Submit (Email & Password Login)
   * 
   * Flow:
   * 1. Prevent default form submission (no page reload)
   * 2. Dispatch login action dengan email & password
   * 3. Wait for login success (unwrap Promise)
   * 4. Fetch wishlist data setelah login berhasil
   * 5. Navigate ke home page
   * 6. Jika error → catch dan log (error akan tampil dari Redux state)
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    
    try {
      // Dispatch login action dan wait for success
      await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap(); // unwrap() throw error jika rejected
      
      // Fetch wishlist setelah login berhasil
      await dispatch(fetchWishlist());
      
      // Redirect ke home page
      navigate('/');
    } catch (err) {
      // Error akan ditampilkan otomatis dari Redux state di UI
      console.error('Auth error:', err);
    }
  };

  /**
   * Handle Google Login Success
   * 
   * Callback yang dipanggil ketika user berhasil login via Google OAuth.
   * Google akan return credential (JWT token) yang berisi user info.
   * 
   * Flow:
   * 1. Terima credential dari Google OAuth popup
   * 2. Dispatch googleLogin action dengan credential
   * 3. Backend akan verify token dan login user
   * 4. Fetch wishlist setelah login berhasil
   * 5. Navigate ke home page
   * 
   * Note: Google Login hanya untuk user yang SUDAH register via Google.
   * Jika email belum terdaftar, backend akan return error.
   * 
   * @param {Object} credentialResponse - Response dari Google OAuth
   * @param {string} credentialResponse.credential - Google ID token (JWT)
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Dispatch googleLogin dengan Google credential token
      await dispatch(googleLogin(credentialResponse.credential)).unwrap();
      
      // Fetch wishlist setelah login berhasil
      await dispatch(fetchWishlist());
      
      // Redirect ke home
      navigate('/');
    } catch (err) {
      console.error('Google Login error:', err);
      // Error akan ditampilkan otomatis dari Redux state
    }
  };

  /**
   * Handle Google Login Error
   * 
   * Callback yang dipanggil ketika Google OAuth gagal atau dibatalkan user.
   * Scenarios:
   * - User close OAuth popup
   * - Network error
   * - Google OAuth service down
   * 
   * @param {Object} error - Error object dari Google OAuth
   */
  const handleGoogleError = () => {
    alert('Google Sign-In failed. Please try again.');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="container">
        <div className="row justify-content-center align-items-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <div className="card-body p-5">
                {/* Logo & Title */}
                <div className="text-center mb-4">
                  <h1 className="display-5 fw-bold text-primary mb-2">
                    <i className="bi bi-globe-americas"></i> NextTrip
                  </h1>
                  <p className="text-muted">Welcome back! Please login</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Login/Register Form */}
                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="position-relative my-4">
                  <hr />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                    or
                  </span>
                </div>

                {/* Google Sign-In */}
                <div className="d-flex justify-content-center mb-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>

                {/* Link to Register */}
                <div className="text-center mt-3">
                  <p className="text-muted mb-2">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary text-decoration-none fw-bold">
                      Register here
                    </Link>
                  </p>
                </div>

                {/* Browse as Guest */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/')}
                  >
                    Browse as Guest
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
