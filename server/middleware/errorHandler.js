/**
 * Error Handler Middleware
 * 
 * Global error handler untuk menangani semua error dalam aplikasi.
 * Middleware ini:
 * - Centralized error handling (semua error ditangani di satu tempat)
 * - Convert error menjadi HTTP response yang konsisten
 * - Log error untuk debugging
 * - Mengirim response yang user-friendly
 * 
 * Error Types yang ditangani:
 * - Sequelize errors (validation, unique constraint)
 * - JWT errors (invalid token, expired token)
 * - Custom errors (Unauthorized, NotFound, Forbidden, BadRequest)
 * - External API errors
 * - Unknown errors (500 Internal Server Error)
 * 
 * Usage:
 * Letakkan di paling akhir middleware chain:
 * app.use(errorHandler);
 */

/**
 * Error Handler Middleware Function
 * 
 * @param {Error} err - Error object yang di-throw
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (tidak digunakan)
 * 
 * @example
 * // Di controller:
 * throw { name: 'NotFound', message: 'User not found' };
 * 
 * // Di route:
 * app.use(errorHandler); // Letakkan di akhir
 */
module.exports = function errorHandler(err, req, res, next) {
    // Log error ke console untuk debugging (di production gunakan logger library)
    console.error('Error occurred:', err);
    console.error('Error stack:', err.stack); // Stack trace untuk tracking bug

    // Sequelize Validation Error
    // Contoh: Email format salah, password kurang dari 5 karakter
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: err.errors[0].message });
    }

    // JWT Errors
    // - JsonWebTokenError: Token invalid/malformed
    // - TokenExpiredError: Token sudah expired
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // 401 Unauthorized
    // User belum login atau token invalid
    if (err.name === 'Unauthorized') {
        return res.status(401).json({ message: err.message });
    }

    // 404 Not Found
    // Resource yang dicari tidak ditemukan (user, place, wishlist item)
    if (err.name === 'NotFound') {
        return res.status(404).json({ message: err.message });
    }

    // 403 Forbidden
    // User tidak punya permission untuk akses resource
    // Contoh: User A mencoba delete wishlist milik User B
    if (err.name === 'Forbidden') {
        return res.status(403).json({ message: err.message });
    }

    // 400 Bad Request
    // Request tidak valid (missing field, format salah)
    if (err.name === 'BadRequest') {
        return res.status(400).json({ message: err.message });
    }

    // 502 Bad Gateway / External API Error
    // Error dari API eksternal (Gemini, Geoapify, Unsplash)
    if (err.name === 'ExternalAPIError') {
        return res.status(502).json({ message: err.message });
    }

    // 500 Internal Server Error (catch-all)
    // Jika error tidak dikenali, return generic error
    res.status(500).json({ message: 'Internal Server Error' });
}