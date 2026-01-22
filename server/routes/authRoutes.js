const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google-register', AuthController.googleRegister);
router.post('/google-login', AuthController.googleLogin);
router.post('/google-sign-in', AuthController.googleSignIn);

module.exports = router;