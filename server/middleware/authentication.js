// authentication middleware untuk memverifikasi token JWT dan mengautentikasi user.

const { User } = require('../models');
const { verifyToken } = require('../helpers/jwt');

module.exports = async function authentication(req, res, next) {
    try {
        // Mendapatkan token dari header Authorization
        const authHeader = req.headers.authorization;

        // Jika tidak ada token, lempar error Unauthorized
        if (!authHeader) {
            throw { name: 'Unauthorized', message: 'Token not provided' };
        }

        // pecahan header untuk mendapatkan tipe dan nilai token
        const rawToken = authHeader.split(' '); // Bearer <token>
        const tokenType = rawToken[0]; // Bearer
        const tokenValue = rawToken[1]; // <token>

        // cek format token
        if (tokenType !== 'Bearer' || !tokenValue) {
            throw { name: 'Unauthorized', message: 'Invalid token format' };
        }

        // verifikasi token menggunakan verifyToken dari helpers/jwt
        const decoded = verifyToken(tokenValue);

        // cek apakah user dengan id dari token ada di database
        const user = await User.findByPk(decoded.id);
        // jika user tidak ditemukan, lempar error Unauthorized
        if (!user) {
            throw { name: 'Unauthorized', message: 'User not found' };
        }
        // jika semua validasi lolos, simpan data user di req.user dan lanjut ke next middleware
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        next();
    } catch (error) {
        // lempar error ke errorHandler middleware.
        return next(error);
    }
}