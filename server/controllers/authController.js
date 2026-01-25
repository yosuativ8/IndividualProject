/**
 * AuthController
 * 
 * Controller untuk mengelola proses autentikasi user:
 * - Register user baru dengan email & password
 * - Login user yang sudah terdaftar
 * - Google OAuth (Register, Login, Sign-In)
 * 
 * Semua endpoint di controller ini bersifat PUBLIC (tidak perlu authentication)
 */

const { User } = require('../models'); // Import model User untuk akses database
const { signToken } = require('../helpers/jwt'); // Helper untuk generate JWT token
const { comparePassword } = require('../helpers/bcrypt'); // Helper untuk compare password yang di-hash
const { OAuth2Client } = require('google-auth-library'); // Library untuk verifikasi Google OAuth token
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Inisialisasi Google OAuth client

module.exports = class AuthController {
    /**
     * Register User Baru (Email & Password)
     * 
     * Method untuk mendaftarkan user baru menggunakan email dan password.
     * Password akan otomatis di-hash oleh Sequelize hooks sebelum disimpan ke database.
     * 
     * @route POST /auth/register
     * @access Public
     * 
     * @param {Object} req.body - Data user yang akan didaftarkan
     * @param {string} req.body.email - Email user (harus unique)
     * @param {string} req.body.password - Password user (min 5 karakter)
     * 
     * @returns {Object} Response dengan status 201
     * @returns {string} access_token - JWT token untuk autentikasi
     * @returns {Object} user - Data user yang baru dibuat (tanpa password)
     * @returns {number} user.id - ID user
     * @returns {string} user.email - Email user
     * 
     * @throws {BadRequest} Jika email atau password tidak diberikan
     * @throws {BadRequest} Jika email sudah terdaftar
     * @throws {ValidationError} Jika email format tidak valid atau password kurang dari 5 karakter
     * 
     * @example
     * // Request Body:
     * {
     *   "email": "user@example.com",
     *   "password": "password123"
     * }
     * 
     * // Response:
     * {
     *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *   "user": {
     *     "id": 1,
     *     "email": "user@example.com"
     *   }
     * }
     */
    static async register(req, res, next) {
        try {
            // Ambil email dan password dari request body
            const { email, password } = req.body;
            
            // Validasi: Pastikan email dan password tidak kosong
            // Ini penting karena kedua field ini required untuk register
            if (!email || !password) {
                throw { name: 'BadRequest', message: 'Email and password are required' };
            }
            
            // Buat user baru di database
            // Password akan otomatis di-hash oleh beforeCreate hook di model User
            const user = await User.create({ email, password });
            
            // Generate JWT token untuk user yang baru dibuat
            // Token ini akan digunakan untuk autentikasi di request selanjutnya
            const access_token = signToken({
                id: user.id // Payload: hanya simpan user ID saja
            });
            
            // Kirim response sukses dengan status 201 (Created)
            // Kembalikan token dan data user (TANPA password untuk keamanan)
            res.status(201).json({
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            // Handle error jika email sudah terdaftar (duplicate)
            // Sequelize akan throw SequelizeUniqueConstraintError
            if (error.name === 'SequelizeUniqueConstraintError') {
                return next({ name: 'BadRequest', message: 'Email is already registered' });
            }
            // Lempar error lain ke errorHandler middleware untuk diproses
            next(error);
        }
    }

    /**
     * Login User
     * 
     * Method untuk login user yang sudah terdaftar menggunakan email dan password.
     * Password yang diberikan akan dibandingkan dengan hash password di database.
     * 
     * @route POST /auth/login
     * @access Public
     * 
     * @param {Object} req.body - Credentials user
     * @param {string} req.body.email - Email user yang terdaftar
     * @param {string} req.body.password - Password user
     * 
     * @returns {Object} Response dengan status 200
     * @returns {string} access_token - JWT token untuk autentikasi
     * @returns {Object} user - Data user yang berhasil login
     * @returns {number} user.id - ID user
     * @returns {string} user.email - Email user
     * 
     * @throws {BadRequest} Jika email atau password tidak diberikan
     * @throws {Unauthorized} Jika email tidak ditemukan
     * @throws {Unauthorized} Jika password salah
     * 
     * @example
     * // Request Body:
     * {
     *   "email": "user@example.com",
     *   "password": "password123"
     * }
     * 
     * // Response:
     * {
     *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *   "user": {
     *     "id": 1,
     *     "email": "user@example.com"
     *   }
     * }
     */
    static async login(req, res, next) {
        try {
            // Ambil email dan password dari request body
            const { email, password } = req.body;
            
            // Validasi: Pastikan email dan password tidak kosong
            if (!email || !password) {
                throw { name: 'BadRequest', message: 'Email and password are required' };
            }
            
            // Cari user di database berdasarkan email
            const user = await User.findOne({
                where: { email }
            });
            
            // Jika user tidak ditemukan, lempar error Unauthorized
            // Kita tidak memberitahu detail "email tidak terdaftar" untuk keamanan
            if (!user) {
                throw { name: 'Unauthorized', message: 'Invalid email or password' };
            }
            
            // Bandingkan password yang diberikan dengan hash password di database
            // comparePassword adalah helper function dari bcrypt
            const isPasswordValid = await comparePassword(password, user.password);
            
            // Jika password tidak cocok, lempar error Unauthorized
            if (!isPasswordValid) {
                throw { name: 'Unauthorized', message: 'Invalid email or password' };
            }

            // Jika validasi lolos, generate JWT token untuk user
            const access_token = signToken({
                id: user.id
            });
            
            // Kirim response sukses dengan token dan data user
            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            // Lempar error ke errorHandler middleware
            next(error);
        }
    }

    /**
     * Google Register
     * 
     * Method untuk mendaftarkan user BARU menggunakan Google OAuth.
     * User harus login dengan Google untuk pertama kali dan email belum terdaftar.
     * Jika email sudah terdaftar, user harus menggunakan endpoint google-login.
     * 
     * @route POST /auth/google-register
     * @access Public
     * 
     * @param {Object} req.body
     * @param {string} req.body.id_token - Google ID token dari Google Sign-In
     * 
     * @returns {Object} Response dengan status 201
     * @returns {string} access_token - JWT token untuk autentikasi
     * @returns {Object} user - Data user yang baru dibuat
     * @returns {number} user.id - ID user
     * @returns {string} user.email - Email user dari Google
     * @returns {string} message - Pesan sukses registrasi
     * 
     * @throws {BadRequest} Jika id_token tidak diberikan
     * @throws {BadRequest} Jika email sudah terdaftar
     * @throws {Unauthorized} Jika Google token tidak valid
     * 
     * @example
     * // Request Body:
     * {
     *   "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0..."
     * }
     * 
     * // Response:
     * {
     *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *   "user": {
     *     "id": 1,
     *     "email": "user@gmail.com"
     *   },
     *   "message": "Registration successful!"
     * }
     */
    static async googleRegister(req, res, next) {
        try {
            // Ambil Google ID token dari request body
            // Token ini didapat dari Google Sign-In di frontend
            const { id_token } = req.body;
            
            // Verifikasi Google ID token menggunakan Google OAuth2Client
            // Ini memastikan token valid dan benar-benar dari Google
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID // Harus cocok dengan Client ID kita
            });
            
            // Extract payload dari token yang sudah diverifikasi
            // Payload berisi informasi user dari Google (email, name, picture, dll)
            const payload = ticket.getPayload();
            const email = payload.email; // Ambil email user dari Google
            
            // Cek apakah email sudah terdaftar di database
            const existingUser = await User.findOne({ where: { email } });
            
            // Jika email sudah terdaftar, tolak registrasi
            // User harus menggunakan endpoint google-login atau google-sign-in
            if (existingUser) {
                throw { name: 'BadRequest', message: 'Email is already registered. Please login instead.' };
            }
            
            // Buat user baru di database dengan email dari Google
            // Password diisi dengan string dummy karena Google OAuth tidak butuh password
            const user = await User.create({
                email,
                password: 'google-oauth-no-password' // Password dummy untuk Google users
            });
            
            // Generate JWT token untuk user baru
            const access_token = signToken({
                id: user.id
            });
            
            // Kirim response sukses dengan status 201 (Created)
            res.status(201).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                },
                message: 'Registration successful!'
            });
        } catch (error) {
            // Lempar error ke errorHandler middleware
            next(error);
        }
    }

    /**
     * Google Login
     * 
     * Method untuk login user yang SUDAH terdaftar menggunakan Google OAuth.
     * Email harus sudah terdaftar di database (via google-register atau google-sign-in).
     * 
     * @route POST /auth/google-login
     * @access Public
     * 
     * @param {Object} req.body
     * @param {string} req.body.id_token - Google ID token dari Google Sign-In
     * 
     * @returns {Object} Response dengan status 200
     * @returns {string} access_token - JWT token untuk autentikasi
     * @returns {Object} user - Data user yang berhasil login
     * @returns {number} user.id - ID user
     * @returns {string} user.email - Email user dari Google
     * 
     * @throws {BadRequest} Jika id_token tidak diberikan
     * @throws {Unauthorized} Jika Google token tidak valid
     * @throws {Unauthorized} Jika email belum terdaftar
     * 
     * @example
     * // Request Body:
     * {
     *   "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0..."
     * }
     * 
     * // Response:
     * {
     *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *   "user": {
     *     "id": 1,
     *     "email": "user@gmail.com"
     *   }
     * }
     */
    static async googleLogin(req, res, next) {
        try {
            // Ambil Google ID token dari request body
            const { id_token } = req.body;
            
            // Verifikasi Google ID token
            // Memastikan token valid dan berasal dari Google
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            
            // Extract email dari payload token
            const payload = ticket.getPayload();
            const email = payload.email;
            
            // Cari user di database berdasarkan email
            const user = await User.findOne({ where: { email } });
            
            // Jika user tidak ditemukan, tolak login
            // User harus register dulu menggunakan google-register
            if (!user) {
                throw { name: 'Unauthorized', message: 'Account not found. Please register first.' };
            }
            
            // Generate JWT token untuk user yang sudah terdaftar
            const access_token = signToken({
                id: user.id
            });
            
            // Kirim response sukses dengan status 200 (OK)
            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            // Lempar error ke errorHandler middleware
            next(error);
        }
    }

    /**
     * Google Sign-In (Auto Register/Login)
     * 
     * Method untuk Google Sign-In dengan auto register jika user belum terdaftar.
     * Ini adalah cara paling mudah untuk implementasi Google OAuth:
     * - Jika email BELUM terdaftar → auto register user baru
     * - Jika email SUDAH terdaftar → login user tersebut
     * 
     * Method ini untuk backward compatibility dan kemudahan UX.
     * 
     * @route POST /auth/google-sign-in
     * @access Public
     * 
     * @param {Object} req.body
     * @param {string} req.body.id_token - Google ID token dari Google Sign-In
     * 
     * @returns {Object} Response dengan status 200
     * @returns {string} access_token - JWT token untuk autentikasi
     * @returns {Object} user - Data user
     * @returns {number} user.id - ID user
     * @returns {string} user.email - Email user dari Google
     * @returns {boolean} isNewUser - true jika user baru dibuat, false jika sudah ada
     * 
     * @throws {BadRequest} Jika id_token tidak diberikan
     * @throws {Unauthorized} Jika Google token tidak valid
     * 
     * @example
     * // Request Body:
     * {
     *   "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0..."
     * }
     * 
     * // Response (User Baru):
     * {
     *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *   "user": {
     *     "id": 1,
     *     "email": "user@gmail.com"
     *   },
     *   "isNewUser": true
     * }
     * 
     * // Response (User Existing):
     * {
     *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *   "user": {
     *     "id": 1,
     *     "email": "user@gmail.com"
     *   },
     *   "isNewUser": false
     * }
     */
    static async googleSignIn(req, res, next) {
        try {
            // Ambil Google ID token dari request body
            const { id_token } = req.body;
            
            // Verifikasi Google ID token
            // Memastikan token valid dan berasal dari Google
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            
            // Extract email dari payload token
            const payload = ticket.getPayload();
            const email = payload.email;
            
            // findOrCreate pattern dari Sequelize
            // Cari user berdasarkan email:
            // - Jika DITEMUKAN → return user yang ada (created = false)
            // - Jika TIDAK DITEMUKAN → buat user baru dengan data defaults (created = true)
            // Return: [instance, wasCreated boolean]
            const [user, created] = await User.findOrCreate({
                where: { email }, // Kondisi pencarian
                defaults: {
                    email,
                    password: 'google-oauth-no-password' // Password dummy untuk Google users
                }
            });

            // Generate JWT token untuk user (baik user baru maupun existing)
            const access_token = signToken({
                id: user.id
            });
            
            // Kirim response sukses dengan status 200 (OK)
            // isNewUser: true jika user baru dibuat, false jika sudah ada sebelumnya
            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                },
                isNewUser: created // Informasi untuk frontend: apakah perlu show welcome message?
            });
        } catch (error) {
            // Lempar error ke errorHandler middleware
            next(error);
        }
    }
}