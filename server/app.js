// Server Backend untuk Aplikasi Tourism Places
// Server ini menggunakan Express.js untuk membuat REST API
// Database menggunakan PostgreSQL dengan Sequelize ORM
// Authentication menggunakan JWT dan Google OAuth

// Import dependencies
const express = require('express'); // Framework untuk membuat server
const cors = require('cors'); // Middleware untuk mengizinkan request dari client (frontend)
require('dotenv').config(); // Load environment variables dari file .env

// Import routes
const authRoutes = require('./routes/authRoutes'); // Routes untuk authentication (register, login, google sign-in)
const placeRoutes = require('./routes/placeRoutes'); // Routes untuk data destinasi wisata (read-only)
const userDestinationRoutes = require('./routes/userDestinationRoutes'); // Routes untuk wishlist user
const geminiRoutes = require('./routes/geminiRoutes'); // Routes untuk AI recommendation

// Import error handler middleware
const errorHandler = require('./middleware/errorHandler'); // Middleware untuk menangani error secara global

// Inisialisasi express app
const app = express();

// Middleware global - dijalankan untuk setiap request
app.use(cors()); // Mengizinkan request dari domain berbeda (frontend)
app.use(express.json()); // Parsing JSON request body
app.use(express.urlencoded({ extended: true })); // Parsing URL-encoded data (form data)

// Routes - Menghubungkan endpoint dengan controller
app.use('/auth', authRoutes); // Semua endpoint auth akan dimulai dengan /auth (contoh: /auth/register)
app.use('/places', placeRoutes); // Semua endpoint places akan dimulai dengan /places (contoh: /places, /places/nearby)
app.use('/wishlist', userDestinationRoutes); // Semua endpoint wishlist akan dimulai dengan /wishlist (contoh: /wishlist)
app.use('/gemini', geminiRoutes); // Semua endpoint gemini akan dimulai dengan /gemini (contoh: /gemini/recommend)

// Error Handler - Middleware ini harus di paling akhir
app.use(errorHandler); // Menangani semua error yang terjadi di aplikasi

// Menjalankan server
const PORT = process.env.PORT || 3000; // Ambil PORT dari environment variable atau default 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // Log pesan saat server berhasil dijalankan
});

// Export app untuk testing
module.exports = app;