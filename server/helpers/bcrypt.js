/**
 * Bcrypt Helper
 * 
 * Helper functions untuk enkripsi dan verifikasi password menggunakan bcrypt.
 * Bcrypt adalah algoritma hashing yang aman untuk menyimpan password.
 * 
 * Kenapa pakai bcrypt?
 * - One-way hash: Password tidak bisa di-decrypt kembali
 * - Salt: Setiap password punya salt unik (mencegah rainbow table attack)
 * - Slow: Sengaja lambat untuk mencegah brute force attack
 * - Adaptive: Bisa increase cost factor seiring waktu
 */

const bcrypt = require('bcrypt'); // Library bcrypt untuk password hashing

/**
 * Hash Password
 * 
 * Function untuk mengubah plain text password menjadi hashed password.
 * Password akan di-hash menggunakan bcrypt dengan salt 10 rounds.
 * 
 * @param {string} plainPassword - Password dalam bentuk plain text
 * @returns {Promise<string>} Hashed password yang aman untuk disimpan di database
 * 
 * @example
 * const hashed = await hashPassword("mypassword123");
 * console.log(hashed); 
 * // Output: "$2b$10$..." (60 karakter)
 */
const hashPassword = async (plainPassword) => {
    // Generate salt dengan 10 rounds (cost factor)
    // Semakin tinggi rounds, semakin lambat dan aman (default: 10)
    const salt = await bcrypt.genSalt(10);
    
    // Hash password menggunakan salt yang telah di-generate
    return await bcrypt.hash(plainPassword, salt);
};

/**
 * Compare Password
 * 
 * Function untuk membandingkan plain text password dengan hashed password.
 * Digunakan saat login untuk verify password yang diinput user.
 * 
 * @param {string} plainPassword - Password yang diinput user (plain text)
 * @param {string} hashedPassword - Password ter-hash dari database
 * @returns {Promise<boolean>} true jika password cocok, false jika tidak cocok
 * 
 * @example
 * const isValid = await comparePassword("mypassword123", "$2b$10$...");
 * if (isValid) {
 *   console.log("Password benar!");
 * } else {
 *   console.log("Password salah!");
 * }
 */
const comparePassword = async (plainPassword, hashedPassword) => {
    // Bcrypt secara otomatis extract salt dari hashedPassword dan compare
    return await bcrypt.compare(plainPassword, hashedPassword);
};
module.exports = {
    hashPassword,
    comparePassword
};