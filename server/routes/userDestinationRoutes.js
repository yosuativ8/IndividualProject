/**
 * User Destination Routes (Wishlist Routes)
 * 
 * Routes untuk semua endpoint yang berhubungan dengan wishlist/bucket list user.
 * Semua routes di file ini bersifat PRIVATE (perlu authentication).
 * 
 * Features:
 * - View wishlist
 * - Add place to wishlist
 * - Update wishlist item (notes, visit date)
 * - Remove place from wishlist
 * 
 * Base Path: /wishlist
 * Authentication: Required (JWT token di Authorization header)
 * Authorization: User hanya bisa akses wishlist miliknya sendiri
 */

const express = require('express');
const router = express.Router();

// Import controller
const UserDestinationController = require('../controllers/userDestinationController');

// Import middleware
const authentication = require('../middleware/authentication');

// ========== PRIVATE ROUTES (Authentication Required) ==========
// Flow: Request → authentication middleware (verify JWT) → Controller

/**
 * GET /wishlist
 * Get all places yang disimpan user (wishlist)
 * Data di-join dengan Place untuk detail lengkap
 * 
 * @access Private
 * @middleware authentication
 * @controller UserDestinationController.getUserWishlist
 * @returns {Array<Object>} Array of wishlist items dengan place details
 * @example
 * GET /wishlist
 * Headers: { Authorization: "Bearer <token>" }
 */
router.get('/', authentication, UserDestinationController.getUserWishlist);

/**
 * POST /wishlist
 * Tambahkan place ke wishlist user
 * 
 * @access Private
 * @middleware authentication
 * @body {number} placeId - ID place yang akan disave (required)
 * @body {string} notes - Catatan pribadi (optional)
 * @body {date} visitDate - Rencana tanggal kunjungan (optional)
 * @controller UserDestinationController.addToWishlist
 * @example
 * POST /wishlist
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { "placeId": 5, "notes": "Visit with family" }
 */
router.post('/', authentication, UserDestinationController.addToWishlist);

/**
 * PUT /wishlist/:id
 * Update notes atau visitDate dari wishlist item
 * User hanya bisa update wishlist miliknya sendiri (ownership check)
 * 
 * @access Private
 * @middleware authentication
 * @param {number} id - UserDestination ID (bukan placeId!)
 * @body {string} notes - Catatan baru (optional)
 * @body {date} visitDate - Tanggal kunjungan baru (optional)
 * @controller UserDestinationController.updateWishlistItem
 * @example
 * PUT /wishlist/3
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { "notes": "Bring camera", "visitDate": "2025-06-15" }
 */
router.put('/:id', authentication, UserDestinationController.updateWishlistItem);

/**
 * DELETE /wishlist/:id
 * Hapus place dari wishlist user
 * User hanya bisa delete wishlist miliknya sendiri (ownership check)
 * 
 * @access Private
 * @middleware authentication
 * @param {number} id - UserDestination ID (bukan placeId!)
 * @controller UserDestinationController.removeFromWishlist
 * @example
 * DELETE /wishlist/3
 * Headers: { Authorization: "Bearer <token>" }
 */
router.delete('/:id', authentication, UserDestinationController.removeFromWishlist);

module.exports = router;