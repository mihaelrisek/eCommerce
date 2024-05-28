const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const search = require('../controllers/searchController');
const authMiddleware = require('../middleware/authenticationMiddleware');


/**
 * Shop routes
 */
router.get('/', shopController.home);

/**
 * Profile route
 */
router.get('/profil', shopController.profil);
router.post('/profil/:user_id', shopController.updateUser);

/**
 * Product routes
 */
router.get('/products/:material', shopController.renderByMaterial);
router.get('/products-category/:category', shopController.renderByCategory);
router.get('/products/:material/:category', shopController.renderByMaterialAndCategory);

router.get('/products', shopController.getAllProducts);
router.post('/load_more', shopController.loadMoreProducts);
router.post('/filter_products', shopController.filterProducts);

router.get('/product/:product_name-:product_id', shopController.getSpecificProduct);

router.post('/products/:product_id/comments', shopController.addComment);
router.post('/products/:product_id/comments/:comment_id/delete', shopController.deleteComment);


/**
 * Cart routes
 */
router.post('/add-to-cart', shopController.addToCart);
router.post('/remove-from-cart/:product_id/:size', shopController.removeFromCart);
router.get('/cart', shopController.cart);

/**
 * Order routes
 */
router.get('/delivery', shopController.renderDelivery);
router.post('/delivery', shopController.processUserDelivery);

router.get('/delivery/guest', shopController.renderGuestDelivery);
router.post('/delivery/guest', shopController.proccesGuestDelivery);

router.get('/profil/order/:order_id', shopController.viewOrder);
router.post('/order/cancel-order/:order_id', shopController.cancelOrder);

/**
 * Search
 */
router.get('/search', search.searchProducts);


module.exports = router;