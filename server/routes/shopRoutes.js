// shopRoutes.js

const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authMiddleware = require('../middleware/authenticationMiddleware');


/**
 * Shop routes
 */
router.get('/', shopController.home);
router.get('/contact', shopController.contact);
router.get('/about', authMiddleware, shopController.about); // Route requiring authentication



/**
 * Profile route
 */
router.get('/profil', shopController.profil);
router.post('/profil/:user_id', shopController.updateUser);

/**
 * Product routes
 */

router.get('/products/:category', shopController.renderByCategory);
router.get('/products/:category/:subcategory', shopController.renderByCategory_subcategory);
router.get('/products', shopController.getAllProducts);
router.get('/:product_name-:product_id', shopController.getSpecificProduct);
router.post('/products/:product_id/comments', shopController.addComment);
router.post('/products/:product_id/comments/:comment_id/delete', shopController.deleteComment);
/**
 * Cart routes
 */
router.post('/add-to-cart', shopController.addToCart);
router.post('/remove-from-cart/:productId?', shopController.removeFromCart);
router.get('/cart', shopController.cart);

router.get('/delivery', shopController.delivery);
router.get('/checkout', shopController.checkout);



module.exports = router;
