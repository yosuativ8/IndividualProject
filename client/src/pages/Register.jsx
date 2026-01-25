/**
 * Register Page Component
 * 
 * Halaman registrasi untuk user baru dengan dua metode:
 * 1. Email & Password (traditional registration)
 * 2. Google Sign-Up (OAuth 2.0)
 * 
 * Features:
 * - Form validation (email format, password min 6 chars)
 * - Loading state saat submit
 * - Error handling dengan alert display
 * - Integration dengan Google OAuth
 * - Auto redirect ke login page setelah register berhasil (email/password)
 * - Auto login setelah Google register berhasil
 * - Link ke Login page
 * - Browse as Guest option
 * 
 * User Flow:
 * - Email/Password: Input → Submit → Success alert → Redirect to Login
 * - Google: Klik button → OAuth popup → Auto register + login → Redirect to Home
 * 
 * Access: Public (tidak perlu login untuk akses page ini)
 * 
 * @component
 * @example
 * <Route path="/register" element={<Register />} />
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, googleRegister } from '../store/slices/authSlice';
import { fetchWishlist } from '../store/slices/wishlistSlice';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
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
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Handle submit form register dengan email & password
   * - Dispatch action register ke Redux
   * - Tampilkan alert success
   * - Navigate ke login page
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(register(formData)).unwrap();
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  /**
   * Handle Google Register success
   * - Verifikasi token dari Google OAuth
   * - Buat akun baru dengan email dari Google
   * - Auto login dan fetch wishlist
   * - Redirect ke home page
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(googleRegister(credentialResponse.credential)).unwrap();
      await dispatch(fetchWishlist());
      alert('Registration successful!');
      navigate('/');
    } catch (err) {
      console.error('Google Register error:', err);
      // Error akan ditampilkan otomatis dari Redux state
    }
  };

  /**
   * Handle Google Register error
   * Tampilkan alert jika OAuth popup gagal atau dibatalkan
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
                  <p className="text-muted">Create your account</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Register Form */}
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
                      placeholder="Enter your password (min 6 characters)"
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
                        Creating account...
                      </>
                    ) : (
                      'Register'
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
                    text="signup_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>

                {/* Link to Login */}
                <div className="text-center mt-3">
                  <p className="text-muted mb-2">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary text-decoration-none fw-bold">
                      Login here
                    </Link>
                  </p>
                </div>

                {/* Browse as Guest */}
                <div className="text-center mt-3">
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
