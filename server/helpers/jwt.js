/**
 * JWT Helper
 * 
 * Helper functions untuk generate dan verify JWT (JSON Web Token).
 * JWT digunakan untuk autentikasi stateless:
 * - Server tidak perlu menyimpan session
 * - Token dibawa client di setiap request
 * - Token berisi informasi terenkripsi (signed dengan secret key)
 * 
 * Token Structure: header.payload.signature
 * - Header: Algoritma dan type token
 * - Payload: Data yang disimpan (user id, role, dll)
 * - Signature: Hash dari header + payload + secret key
 */

const jwt = require('jsonwebtoken'); // Library jsonwebtoken untuk JWT operations

// Secret key dari environment variable (JANGAN HARDCODE!)
// Secret key digunakan untuk sign dan verify token
const SECRET_KEY = process.env.JWT_SECRET;

/**
 * Sign Token (Generate JWT)
 * 
 * Function untuk membuat/generate JWT token dari data payload.
 * Token ini akan dikirim ke client dan disimpan di localStorage/cookies.
 * 
 * @param {Object} data - Data yang akan disimpan dalam token (payload)
 * @param {number} data.id - User ID (wajib)
 * @param {string} [data.email] - User email (opsional)
 * @param {string} [data.role] - User role (opsional)
 * @returns {string} JWT token string
 * 
 * @example
 * const token = signToken({ id: 1, email: "user@example.com" });
 * console.log(token);
 * // Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
const signToken = (data) => {
    // jwt.sign() generate token dengan:
    // - data: payload yang akan disimpan (user info)
    // - SECRET_KEY: kunci untuk sign token (harus sama saat verify)
    // - options (opsional): expiresIn, algorithm, dll
    return jwt.sign(data, SECRET_KEY); // Default: tidak expire
};

/**
 * Verify Token
 * 
 * Function untuk memverifikasi JWT token.
 * Mengecek apakah token valid, belum expire, dan signature benar.
 * 
 * @param {string} token - JWT token yang akan diverifikasi
 * @returns {Object} Decoded payload (data yang ada di dalam token)
 * @throws {JsonWebTokenError} Jika token invalid
 * @throws {TokenExpiredError} Jika token sudah expired
 * 
 * @example
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(decoded); // { id: 1, email: "user@example.com", iat: 1234567890 }
 * } catch (error) {
 *   console.log("Token invalid!");
 * }
 */
const verifyToken = (token) => {
    // jwt.verify() akan:
    // - Check signature menggunakan SECRET_KEY
    // - Check token expiry (jika ada)
    // - Return decoded payload jika valid
    // - Throw error jika invalid
    return jwt.verify(token, SECRET_KEY);
};

module.exports = {
    signToken,
    verifyToken
}