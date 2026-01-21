// authorization middleware untuk memeriksa hak akses user berdasarkan peran (role).

module.exports = function authorization(req, res, next) {
    try {
        // cek apakah req.user ada (harusnya sudah di-set oleh middleware authentication)
        if (!req.user) {
            // jika req.user tidak ada, lempar error Unauthorized
            throw { name: 'Unauthorized', message: 'User not authenticated' };
        }
    } catch (error) { // lempar error ke errorHandler middleware
        return next(error);
        
    }
}