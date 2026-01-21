// userDestinationRoutes untuk mengatur endpoint-endpoint wishlist/bucket list user
// Routes ini menghubungkan HTTP request dengan method di UserDestinationController

const express = require('express');
const router = express.Router();

// Import controller
const UserDestinationController = require('../controllers/userDestinationController');

// Import middleware
const authentication = require('../middleware/authentication'); // Semua endpoint perlu login

// Semua routes di sini perlu authentication
// Flow: Request -> authentication middleware (cek JWT token) -> Controller method

// GET /wishlist - Mendapatkan semua destinasi yang disimpan user (wishlist)
router.get('/', authentication, UserDestinationController.getUserWishlist);

// POST /wishlist - Menambahkan destinasi ke wishlist user
// Body: { placeId, notes (optional), visitDate (optional) }
router.post('/', authentication, UserDestinationController.addToWishlist);

// PUT /wishlist/:id - Update notes atau visitDate di wishlist
// Body: { notes, visitDate }
router.put('/:id', authentication, UserDestinationController.updateWishlistItem);

// DELETE /wishlist/:id - Menghapus destinasi dari wishlist
router.delete('/:id', authentication, UserDestinationController.removeFromWishlist);

// Export router
module.exports = router;