/**
 * Authentication Middleware
 * 
 * Middleware untuk memverifikasi JWT token dan authenticate user.
 * Middleware ini akan:
 * 1. Extract JWT token dari request header
 * 2. Verify token validity
 * 3. Lookup user di database
 * 4. Attach user data ke req.user
 * 5. Lanjut ke next middleware jika valid
 * 
 * Digunakan untuk protect routes yang butuh login (private routes).
 * 
 * Usage:
 * - app.get('/protected', authentication, handler)
 * - router.use(authentication) // Protect semua routes di router
 */

const { User } = require('../models'); // Model User untuk lookup
const { verifyToken } = require('../helpers/jwt'); // Helper untuk verify JWT

/**
 * Authentication Middleware Function
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @throws {Unauthorized} Jika token tidak ada atau invalid
 * @throws {Unauthorized} Jika user tidak ditemukan di database
 * 
 * @example
 * // Protect single route
 * router.get('/wishlist', authentication, getWishlist);
 * 
 * // Protect all routes in router
 * router.use(authentication);
 * router.get('/profile', getProfile);
 * router.put('/profile', updateProfile);
 */
module.exports = async function authentication(req, res, next) {
    try {
        // Step 1: Mendapatkan token dari header Authorization
        // Format header: "Authorization: Bearer <token>"
        const authHeader = req.headers.authorization;

        // Jika tidak ada Authorization header, tolak request
        if (!authHeader) {
            throw { name: 'Unauthorized', message: 'Token not provided' };
        }

        // Step 2: Parse token dari header
        // Split "Bearer eyJhbGc..." menjadi ["Bearer", "eyJhbGc..."]
        const rawToken = authHeader.split(' ');
        const tokenType = rawToken[0]; // "Bearer"
        const tokenValue = rawToken[1]; // "eyJhbGc..."

        // Validasi format token (harus Bearer token)
        if (tokenType !== 'Bearer' || !tokenValue) {
            throw { name: 'Unauthorized', message: 'Invalid token format' };
        }

        // Step 3: Verifikasi token menggunakan JWT helper
        // Akan throw error jika token invalid atau expired
        const decoded = verifyToken(tokenValue);

        // Step 4: Cek apakah user dengan id dari token masih ada di database
        // (User bisa saja sudah dihapus tapi tokennya masih valid)
        const user = await User.findByPk(decoded.id);
        
        // Jika user tidak ditemukan, tolak request
        if (!user) {
            throw { name: 'Unauthorized', message: 'User not found' };
        }
        
        // Step 5: Jika semua validasi lolos, attach user data ke req.user
        // req.user bisa diakses di next middleware atau controller
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        
        // Lanjut ke next middleware atau controller
        next();
    } catch (error) {
        // Jika ada error (token invalid, user not found, dll)
        // Lempar ke errorHandler middleware
        return next(error);
    }
}