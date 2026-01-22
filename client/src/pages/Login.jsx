// Login Page - Halaman untuk Login, Register, dan Google Sign-In
// Non-user bisa lihat destinasi tapi tidak bisa add wishlist atau chatbot
// Hanya user login yang bisa access features tersebut

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, googleLogin } from '../store/slices/authSlice';
import { fetchWishlist } from '../store/slices/wishlistSlice';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  /**
   * Handle perubahan input form (email & password)
   * Update state formData setiap kali user mengetik
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Handle submit form login dengan email & password
   * - Dispatch action login ke Redux
   * - Fetch wishlist setelah login berhasil
   * - Navigate ke home page
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap();
      await dispatch(fetchWishlist());
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  /**
   * Handle Google Login success
   * - Verifikasi token dari Google OAuth
   * - Login hanya jika user sudah pernah register via Google
   * - Fetch wishlist dan redirect ke home
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await dispatch(googleLogin(credentialResponse.credential)).unwrap();
      await dispatch(fetchWishlist());
      navigate('/');
    } catch (err) {
      console.error('Google Login error:', err);
      // Error akan ditampilkan otomatis dari Redux state
    }
  };

  /**
   * Handle Google Login error
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
