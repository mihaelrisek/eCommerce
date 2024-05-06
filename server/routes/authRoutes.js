
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authenticationMiddleware');

/**
 * Register routes
 */
router.get('/register', authController.renderRegister);
router.post('/register', authController.registerUser);

/**
 * Login routes
 */
router.get('/login', authController.login);
router.post('/login', authController.loginUser);
router.get('/logout', authController.logout);

/**
 * Password reset routes
 * Based on email
 */
router.get('/forgot-password', authController.forgotPassGET);
router.post('/forgot-password', authController.forgotPassPOST);

/**
 * Password reset routes
 * Based on token
 */
router.get('/reset/:token', authController.resetPassGET);
router.post('/reset/:token', authController.resetPassPOST);;


module.exports = router;
