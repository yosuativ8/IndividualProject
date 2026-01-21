// jwt helper untuk generate dan verify token.
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET // pastikan untuk menyimpan secret key di environment variable
const signToken = (data) => { // signToken menerima data yang akan dimasukkan ke dalam token
    return jwt.sign(data, SECRET_KEY); // return token yang di-generate
};
// verifyToken menerima token yang akan diverifikasi
const verifyToken = (token) => {
    // return hasil verifikasi token
    return jwt.verify(token, SECRET_KEY);
};

module.exports = {
    signToken,
    verifyToken
}