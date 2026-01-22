// userDestinationController untuk mengelola wishlist/bucket list destinasi user
// Controller ini menangani CRUD operasi untuk destinasi yang disimpan user

// Import models
const { UserDestination, Place, User } = require('../models');

module.exports = class UserDestinationController {
    // Method untuk mendapatkan semua destinasi yang disimpan oleh user (wishlist)
    // Endpoint: GET /wishlist
    // Access: Private (perlu login)
    static async getUserWishlist(req, res, next) {
        try {
            // Ambil userId dari req.user (sudah di-set oleh authentication middleware)
            const userId = req.user.id;

            // Ambil semua destinations yang disimpan oleh user
            const wishlist = await UserDestination.findAll({
                where: { userId },
                include: [
                    {
                        model: Place, // Join dengan Place untuk mendapatkan detail destinasi
                        as: 'place', // Use lowercase alias as defined in model
                        attributes: ['id', 'name', 'description', 'location', 'latitude', 'longitude', 'imageUrl', 'category', 'rating']
                    }
                ],
                order: [['createdAt', 'DESC']] // Urutkan dari yang baru ditambahkan
            });

            // Kembalikan response dalam array langsung untuk frontend
            res.status(200).json(wishlist);
        } catch (error) {
            next(error);
        }
    }

    // Method untuk menambahkan destinasi ke wishlist user
    // Endpoint: POST /wishlist
    // Access: Private (perlu login)
    // Body: { placeId, notes, visitDate }
    static async addToWishlist(req, res, next) {
        try {
            const userId = req.user.id;
            const { placeId, notes, visitDate } = req.body;

            // Validasi placeId wajib
            if (!placeId) {
                throw { name: 'BadRequest', message: 'placeId is required' };
            }

            // Cek apakah place exists
            const place = await Place.findByPk(placeId);
            if (!place) {
                throw { name: 'NotFound', message: 'Place not found' };
            }

            // Cek apakah sudah ada di wishlist (prevent duplicate)
            const existing = await UserDestination.findOne({
                where: { userId, placeId }
            });

            if (existing) {
                throw { name: 'BadRequest', message: 'Place already in your wishlist' };
            }

            // Tambahkan ke wishlist
            const userDestination = await UserDestination.create({
                userId,
                placeId,
                notes: notes || null,
                visitDate: visitDate || null
            });

            // Ambil data lengkap dengan join Place
            const result = await UserDestination.findByPk(userDestination.id, {
                include: [
                    {
                        model: Place,
                        as: 'place', // Use lowercase alias
                        attributes: ['id', 'name', 'description', 'location', 'latitude', 'longitude', 'imageUrl', 'category', 'rating']
                    }
                ]
            });

            // Kembalikan response langsung (bukan nested dalam data)
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    // Method untuk update notes atau visitDate di wishlist
    // Endpoint: PUT /wishlist/:id
    // Access: Private (perlu login + owner)
    // Body: { notes, visitDate }
    static async updateWishlistItem(req, res, next) {
        try {
            const { id } = req.params; // ID dari UserDestination
            const userId = req.user.id;
            const { notes, visitDate } = req.body;

            // Cari item di wishlist
            const item = await UserDestination.findByPk(id);

            // Jika tidak ditemukan
            if (!item) {
                throw { name: 'NotFound', message: 'Wishlist item not found' };
            }

            // Cek ownership: hanya user yang save item ini yang bisa update
            if (item.userId !== userId) {
                throw { name: 'Forbidden', message: 'You are not authorized to update this item' };
            }

            // Update notes dan visitDate
            await item.update({
                notes: notes !== undefined ? notes : item.notes,
                visitDate: visitDate !== undefined ? visitDate : item.visitDate
            });

            // Ambil data lengkap dengan join Place
            const result = await UserDestination.findByPk(id, {
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name', 'description', 'location', 'latitude', 'longitude', 'imageUrl', 'category', 'rating']
                    }
                ]
            });

            // Kembalikan response
            res.status(200).json({
                message: 'Wishlist item updated',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Method untuk menghapus destinasi dari wishlist
    // Endpoint: DELETE /wishlist/:id
    // Access: Private (perlu login + owner)
    static async removeFromWishlist(req, res, next) {
        try {
            const { id } = req.params; // ID dari UserDestination
            const userId = req.user.id;

            // Cari item di wishlist
            const item = await UserDestination.findByPk(id, {
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['id', 'name']
                    }
                ]
            });

            // Jika tidak ditemukan
            if (!item) {
                throw { name: 'NotFound', message: 'Wishlist item not found' };
            }

            // Cek ownership: hanya user yang save item ini yang bisa delete
            if (item.userId !== userId) {
                throw { name: 'Forbidden', message: 'You are not authorized to delete this item' };
            }

            // Hapus dari wishlist
            await item.destroy();

            // Kembalikan response
            res.status(200).json({
                message: 'Place removed from your wishlist',
                removedPlace: {
                    id: item.place.id,
                    name: item.place.name
                }
            });
        } catch (error) {
            next(error);
        }
    }
};
