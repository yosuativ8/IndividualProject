// bcrypt helper untuk hash dan compare password.
const bcrypt = require('bcrypt');

// fungsi untuk meng-hash password
const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(10); // generate salt dengan 10 rounds
    return await bcrypt.hash(plainPassword, salt); // return hashed password
};
// fungsi untuk membandingkan password plain dengan hashed password
const comparePassword = async (plainPassword, hashedPassword) => { // menerima password plain dan hashed password
    return await bcrypt.compare(plainPassword, hashedPassword); // return hasil perbandingan (true/false)
};
module.exports = {
    hashPassword,
    comparePassword
};