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
            
            // kembalikan response dengan status 201 dan data user (tanpa password)
            res.status(201).json({
                id: user.id,
                email: user.email
            });
        } catch (error) {
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
                throw { name: 'BadRequest', message: 'Email or password are required' };
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
            // kembalikan response dengan status 200 dan token JWT
            res.status(200).json({ access_token });
        } catch (error) {
            next(error); // lempar error ke errorHandler middleware
        }
    }

    // method untuk Google Sign-In
    // Endpoint: POST /auth/google-signin
    // Access: Public
    static async googleSignIn(req, res, next) {
        try {
            const { id_token } = req.body; // ambil id_token dari request body
            // verifikasi id_token menggunakan OAuth2Client
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload(); // dapatkan payload dari ticket
            const email = payload.email; // ambil email dari payload
            // cari atau buat user di database berdasarkan email menggunakan findOrCreate untuk mencari atau membuat user baru
            const [user, created] = await User.findOrCreate({
                where: { email },
                defaults: {
                    email,
                    password: 'google-oauth-no-password' // password dummy untuk Google user
                }
            });

            // buat token JWT untuk user
            const access_token = signToken({
                id: user.id
            });
            // kembalikan response dengan status 200 dan token JWT
            res.status(200).json({ 
                access_token,
                // data user yang berhasil login atau register via Google Sign-In
                user: {
                    id: user.id, // id user
                    email: user.email // email user
                },
                // menandakan apakah user baru dibuat atau sudah ada sebelumnya
                isNewUser: created
            });
        } catch (error) {
            next(error); // lempar error ke errorHandler middleware
        }
    }
}