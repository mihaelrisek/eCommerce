// adminRoutes.js
const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');


// Apply adminMiddleware to all routes in this router
 router.use(adminMiddleware);

// CRUD routes for admin

 router.get('/admin/dashboard', adminController.dashboard);
 router.get('/admin/list-users', adminController.listUsers); 

 router.post('/admin/delete-users/:user_id', adminController.deleteUser);
 router.post('/admin/update-role/:user_id', adminController.updateUserRole);


 
 router.get('/admin/list-products', adminController.listProducts);
 router.post('/admin/delete-product/:product_id', adminController.deleteProduct);
 
 
 router.get('/admin/add-product', adminController.renderAddProductForm);
 router.post('/admin/add-product', adminController.addProduct);
 

 router.get('/admin/update-product/:productId', adminController.renderUpdateProduct);
 router.post('/admin/update-product/:productId', adminController.updateProduct);

 router.get('/admin/categories', adminController.renderCategories);

 router.post('/admin/update-product_type/:product_type', adminController.updateProductType);
 router.post('/admin/update-subcategory/:subcategory', adminController.updateSubcategory);


module.exports = router;
