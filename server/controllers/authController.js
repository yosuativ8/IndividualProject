// authController untuk mengelola proses register, login, google sign-in. 
// import model dan helper yang dibutuhkan

const { User } = require('../models');
const { signToken } = require('../helpers/jwt');
const { comparePassword } = require('../helpers/bcrypt');
const { OAuth2Client } = require('google-auth-library');// import OAuth2Client dari google-auth-library
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // inisialisasi OAuth2Client dengan GOOGLE_CLIENT_ID dari environment variable

module.exports = class AuthController {
    // method untuk register user baru (tidak menggunakan Google Sign-In)
    // Endpoint: POST /auth/register
    // Access: Public
    static async register(req, res, next) {
        try {
            const { email, password } = req.body;
            
            // Validasi: email dan password wajib untuk register biasa
            if (!email || !password) {
                throw { name: 'BadRequest', message: 'Email and password are required' };
            }
            
            // membuat user baru di database
            const user = await User.create({ email, password });
            
            // buat token JWT untuk user baru
            const access_token = signToken({
                id: user.id
            });
            
            // kembalikan response dengan status 201, token, dan data user (tanpa password)
            res.status(201).json({
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            // Handle unique constraint error for email
            if (error.name === 'SequelizeUniqueConstraintError') {
                return next({ name: 'BadRequest', message: 'Email is already registered' });
            }
            next(error); // lempar error ke errorHandler middleware
        }
    }

    // method untuk login user
    // Endpoint: POST /auth/login
    // Access: Public
    static async login(req, res, next) {
        try {
            // ambil email dan password dari request body
            const { email, password } = req.body;
            if (!email || !password) { // validasi input
                // lempar error BadRequest jika email atau password kosong
                throw { name: 'BadRequest', message: 'Email and password are required' };
            }
            // cari user di database berdasarkan email
            const user = await User.findOne({
                // cari user dengan email yang sama
                where: { email }
            });
            if (!user) { // jika user tidak ditemukan
                // lempar error Unauthorized
                throw { name: 'Unauthorized', message: 'Invalid email or password' };
            }
            // bandingkan password yang diberikan dengan hashed password di database
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) { // jika password tidak valid
                // lempar error Unauthorized
                throw { name: 'Unauthorized', message: 'Invalid email or password' };
            }

            // jika validasi lolos, buat token JWT untuk user
            const access_token = signToken({
                id: user.id
            });
            // kembalikan response dengan status 200, token JWT, dan user email
            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            next(error); // lempar error ke errorHandler middleware
        }
    }

    // method untuk Google Register - Membuat akun baru dengan Google
    // Endpoint: POST /auth/google-register
    // Access: Public
    static async googleRegister(req, res, next) {
        try {
            const { id_token } = req.body;
            
            // Verifikasi id_token menggunakan OAuth2Client
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            const email = payload.email;
            
            // Cek apakah email sudah terdaftar
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                throw { name: 'BadRequest', message: 'Email is already registered. Please login instead.' };
            }
            
            // Buat user baru
            const user = await User.create({
                email,
                password: 'google-oauth-no-password' // password dummy untuk Google user
            });
            
            // Buat token JWT
            const access_token = signToken({
                id: user.id
            });
            
            res.status(201).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                },
                message: 'Registration successful!'
            });
        } catch (error) {
            next(error);
        }
    }

    // method untuk Google Login - Hanya untuk user yang sudah register via Google
    // Endpoint: POST /auth/google-login
    // Access: Public
    static async googleLogin(req, res, next) {
        try {
            const { id_token } = req.body;
            
            // Verifikasi id_token menggunakan OAuth2Client
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            const email = payload.email;
            
            // Cari user di database
            const user = await User.findOne({ where: { email } });
            
            if (!user) {
                throw { name: 'Unauthorized', message: 'Account not found. Please register first.' };
            }
            
            // Buat token JWT
            const access_token = signToken({
                id: user.id
            });
            
            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // method untuk Google Sign-In (backward compatibility)
    // Endpoint: POST /auth/google-signin
    // Access: Public
    static async googleSignIn(req, res, next) {
        try {
            const { id_token } = req.body;
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            const email = payload.email;
            
            const [user, created] = await User.findOrCreate({
                where: { email },
                defaults: {
                    email,
                    password: 'google-oauth-no-password'
                }
            });

            const access_token = signToken({
                id: user.id
            });
            
            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                },
                isNewUser: created
            });
        } catch (error) {
            next(error);
        }
    }
}