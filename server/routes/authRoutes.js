/**
 * Authentication Routes
 * 
 * Routes untuk semua endpoint yang berhubungan dengan autentikasi user.
 * Semua routes di file ini bersifat PUBLIC (tidak perlu authentication).
 * 
 * Available Methods:
 * - Email/Password Authentication (register, login)
 * - Google OAuth Authentication (google-register, google-login, google-sign-in)
 * 
 * Base Path: /auth
 * Example: POST /auth/register, POST /auth/login
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

/**
 * POST /auth/register
 * Register user baru dengan email & password
 * @access Public
 * @controller AuthController.register
 */
router.post('/register', AuthController.register);

/**
 * POST /auth/login
 * Login user dengan email & password
 * @access Public
 * @controller AuthController.login
 */
router.post('/login', AuthController.login);

/**
 * POST /auth/google-register
 * Register user baru menggunakan Google OAuth
 * Untuk user yang belum pernah register (email baru)
 * @access Public
 * @controller AuthController.googleRegister
 */
router.post('/google-register', AuthController.googleRegister);

/**
 * POST /auth/google-login
 * Login user existing menggunakan Google OAuth
 * Untuk user yang sudah pernah register (email sudah ada di DB)
 * @access Public
 * @controller AuthController.googleLogin
 */
router.post('/google-login', AuthController.googleLogin);

/**
 * POST /auth/google-sign-in
 * Google Sign-In dengan auto register/login
 * Jika email baru → auto register
 * Jika email sudah ada → auto login
 * @access Public
 * @controller AuthController.googleSignIn
 */
router.post('/google-sign-in', AuthController.googleSignIn);

module.exports = router;