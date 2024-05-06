// adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const search = require('../controllers/searchController');


// CRUD routes for admin

 router.get('/admin/users', adminController.listUsers); 
 router.get('/admin/user/:user_id', adminController.renderUser); 

 router.post('/admin/delete-users/:user_id', adminController.deleteUser);
 router.post('/admin/update-role/:user_id', adminController.updateUserRole);

 
 router.get('/admin/list-products', adminController.listProducts);
 router.post('/admin/sort-products', adminController.sortProducts);

 router.post('/admin/delete-product/:product_id', adminController.deleteProduct);
 
 
 router.get('/admin/add-product', adminController.renderAddProductForm);
 router.post('/admin/add-product', adminController.addProduct);
 

 router.get('/admin/update-product/:productId', adminController.renderUpdateProduct);
 router.post('/admin/update-product/:productId', adminController.updateProduct);

 router.get('/admin/categories', adminController.renderCategories);

 router.get('/admin/orders', adminController.renderOrders);
 router.get('/admin/orders/:order_id', adminController.renderOrder);
 router.post('/admin/orders/change/:order_id', adminController.changeOrderStatus);
 router.post('/admin/orders/delete/:order_id', adminController.deleteOrder);

 router.post('/admin/update-material/:material', adminController.updateMaterial);
 router.post('/admin/update-category/:category', adminController.updateCategory);


router.post('/admin/multiple-discount', adminController.setDiscount);


router.get('/admin/search', search.searchProducts);
router.post('/admin/upload', adminController.addCategoryImg);

// router.post('/admin/header-image', adminController.uploadHeaderImage);

module.exports = router;
