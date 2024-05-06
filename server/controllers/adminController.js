const mongoose = require('mongoose');
const User = require('../models/User');  // User.js
const Product = require('../models/Product');  // Product.js
const Order = require('../models/Order');  // Order.js


// An asynchronous function to fetch materials and categories
const getCategories = async () => {
  // Fetch unique materials from the database
  const materials = await Product.distinct('material');

  // Fetch unique categories from the database
  const categories = await Product.distinct('category');

  // Return an object containing the materials and categories
  return { materials, categories };
};



exports.listUsers = async (req, res) => {
  try {
    let users = await User.find({});

    res.render('admin/users.ejs', { layout: 'layouts/admin', title: 'Users',  users })

  } catch (error) {
    res.status(500).send({ message: error.message });
  }

};


exports.renderUser = async ( req, res ) =>{
  try {
    let user_id = req.params.user_id;
    let user = await User.findById(user_id);
    const user_roles = ['regular_user', 'admin'];

    res.render('admin/user.ejs', { layout: 'layouts/admin', title: 'Users',  user, user_roles })

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}



exports.updateUserRole = async (req, res) =>{
  try {
    const user_id = req.params.user_id;
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).send('You can\'t change your own role');
    }

    user.role = req.body.user_role;
    user.updated_at = new Date();

    await user.save();

    res.status(200).send('User role updated successfully');

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}



exports.deleteUser = async (req, res) => {
  try {
    // Extract user ID from the request parameters
    const user_id = req.params.user_id;

    // Check if the logged-in user is an admin
    const loggedInUser = req.user; 
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      return res.status(403).send('Permission denied');
    }

    // Check if the user with the given user_id exists
    const userToDelete = await User.findById(user_id);
    if (!userToDelete) {
      return res.status(404).send('User not found');
    }

    // Remove the user from the database
    await userToDelete.deleteOne({ _id: new mongoose.Types.ObjectId(user_id) });

    res.status(200).send('User deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};


exports.listProducts = async (req, res) => {
  try {
    let user = req.user;

    const products = await Product.find({})

    res.render('admin/list-products.ejs', { layout: 'layouts/admin', title: 'List Users', user , products})
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};

exports.sortProducts = async (req, res) =>{
  try {
    let query = {};

    // Check for selected options in the request body
    if (req.body.material) {
      query.material = { $in: req.body.material }; // Use $in operator for multiple values
    }
    if (req.body.category) {
      query.category = { $in: req.body.category }; // Use $in operator for multiple values
    }
    if (req.body.stock && req.body.stock[0] === 'true') {
      query.stock_quantity = 0;
    }

    console.log("req.stock",req.body.stock)

    console.log("query", query)

    const products = await Product.find(query).lean();

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
}




async function deleteEmptyFolders(material, category, name) {
  try {
      const folderStructure = [
          `${material}/${category}/${name}`,
          `${material}/${category}`,
          material
      ];

      // Check each folder for emptiness
      for (const folder of folderStructure) {
          try {
              const res = await cloudinary.api.resources({
                  type: 'upload',
                  prefix: folder + '/',
                  max_results: 1
              });

              // If no resources are found, delete the folder
              if (res.resources.length === 0) {
                  console.log('Deleting folder:', folder);
                  await cloudinary.api.delete_folder(folder);
                  console.log('Folder deleted:', folder);
              } else {
                  console.log("Folder is not empty");
              }
          } catch (error) {
              // Handle the error specifically for folder not found (HTTP 404)
              if (error.http_code === 404 && error.message.includes("Can't find folder with path")) {
                  console.log('Folder not found:', folder);
              } else {
                  // Log other errors
                  console.error('Error deleting folder:', folder, error.message);
              }
          }
      }
  } catch (error) {
      console.error('Error deleting empty folders:', error.message);
      throw error;
  }
}

exports.deleteProduct = async (req, res) => {
  try {
     // Extract product ID from the request parameters
     const product_id = req.params.product_id;

     // Find the product in the database
     const product = await Product.findById(product_id);
 
     // Check if the product exists
     if (!product) {
       return res.status(404).send('Product not found');
     }
 
     // Remove the product from the database
     await Product.deleteOne({ _id: new mongoose.Types.ObjectId(product_id) });
     
      // Delete associated images from Cloudinary
      if (product.images && product.images.length > 0) {
        await Promise.all(product.images.map(async (imageUrl) => {
          try {
            // Extract public_id from the Cloudinary URL
            const publicId = imageUrl.split('/').pop().split('.')[0];
            const publicPath = `${product.material}/${product.category}/${product.name.trim().toLowerCase()}/${publicId}`;

            // Delete image from Cloudinary
            await cloudinary.uploader.destroy(publicPath);

            console.log('Deleted image from Cloudinary1:', publicPath);

          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
          }
        }));
      }


    await deleteEmptyFolders(product.material, product.category, product.name.trim().toLowerCase());
        

    res.redirect('/admin/list-products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};



exports.renderAddProductForm = async (req, res) => {
  try {
    const user = req.user;

    const { materials, categories } = await getCategories(); 

    res.render('admin/add-product.ejs', {layout: 'layouts/admin', title: "Add Product",  user, materials, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};

    // file upload
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
      cloud_name: 'dyl8whz8t',
      api_key: '549295547786992',
      api_secret: 'Pr7WsJRHteJSmpwvezIn--njtjY',
      secure: true,
    });
    


exports.addProduct = async (req, res) => {
  try {
    
    const { name, description, price,
            stock_quantity,
            check_new_material,
            check_new_category,
            material,
            category,
            new_material,
            new_category,
            percentage,
            start_date,
            end_date,
            discount_active
             } = req.body;

    const detailsKey = req.body['detailsKey[]'];
    const detailsValue = req.body['detailsValue[]'];
    const sizes = req.body['newSize[]'];

    console.log("newSize",sizes)

    const selected_material = check_new_material ? new_material.trim() : material;

    // Use the selected or newly entered category
    const selected_category = check_new_category ? new_category.trim() : category;
    
    const details = Array.isArray(detailsKey)
                  ? detailsKey.reduce((acc, key, index) => {
                      acc[key] = detailsValue && detailsValue[index] ? detailsValue[index] : '';
                      return acc;
                    }, {})
                  : typeof detailsKey === 'string' && typeof detailsValue === 'string'
                  ? { [detailsKey]: detailsValue }
                  : {};

    // Create a new product instance
    const newProduct = new Product({
      name,
      description,
      price,
      stock_quantity,
      material: selected_material,
      category: selected_category,
      details: details,
      sizes: sizes,
      discount: {
        active: req.body.discount_active === 'on' || false,
        percentage: req.body.percentage || 0,
        start_date: req.body.start_date || new Date(),
        end_date: req.body.end_date || new Date()
      }
    });


  // File upload
  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

   // Upload each image to Cloudinary
   await Promise.all(images.map(async (image) => {

     const base64Data = image.data.toString('base64');
     // Construct folder path based on product type and category
     const folder = `${selected_material}/${selected_category}/${name.trim().toLowerCase()}`;

     // Upload image to Cloudinary with the specified folder
     const result = await cloudinary.uploader.upload(`data:${image.mimetype};base64,${base64Data}`, {
       folder: folder,
       resource_type: 'image'
     });
     // Store the URL of the uploaded image in the database
     newProduct.images.push(result.secure_url);

   }));
 }

    // // Save the new product to the database
    await newProduct.save();

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};




exports.renderUpdateProduct = async (req, res) => {
  try {
    const user = req.user;

    let productId = req.params.productId;
    const { materials, categories } = await getCategories(); 

    const product = await Product.findById(productId);

    res.render('admin/update-product.ejs', {layout: 'layouts/admin', title: "Update Product", product, user, materials, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};


exports.updateProduct = async (req, res) => {
  try {


    const productId = req.params.productId;

    // Fetch the existing product from the database
    const existingProduct = await Product.findById(productId);

    const { check_new_material,
            check_new_category,
            new_material,
            new_category
       } = req.body;

    // Use the selected or newly entered produc
    const selected_material = check_new_material ? new_material.trim() : req.body.material;
    // Use the selected or newly entered subcategory
    const selected_category = check_new_category ? new_category.trim() : req.body.category;

    console.log("selected_material",selected_material)
    console.log("selected_category",selected_category)


    // Determine changes in product details
    const hasProductDetailsChanged = existingProduct.material != selected_material ||
                                     existingProduct.category != selected_category ||
                                     existingProduct.name != req.body.name;

    // Array to hold updated image URLs
    let updatedImageUrls = [];

    // Construct old and new folder paths
    const oldFolder = `${existingProduct.material}/${existingProduct.category}/${existingProduct.name.trim().toLowerCase()}`;
    const newFolder = `${selected_material}/${selected_category}/${req.body.name.trim().toLowerCase()}`;

    if (hasProductDetailsChanged) {
      console.log("works")
      // Move images from the old folder to the new folder
      await Promise.all(existingProduct.images.map(async (imageUrl) => {
        try {
            // Extract public_id from the Cloudinary URL
            const publicId = imageUrl.split('/').pop().split('.')[0];
            const oldPublicPath = `${oldFolder}/${publicId}`;

            // Upload image to Cloudinary with the specified folder
            const result = await cloudinary.uploader.upload(imageUrl, {
              folder: newFolder,
              public_id: publicId,
              resource_type: 'image'
            });

            console.log('Uploaded image:', result.secure_url);
            /// Update image URL with the new folder path
            updatedImageUrls.push(result.secure_url); 

             // Delete the image from the old folder
             await cloudinary.uploader.destroy(oldPublicPath);
 
             console.log('Deleted image from Cloudinary1:', oldPublicPath);

             await deleteEmptyFolders(existingProduct.material, existingProduct.category, existingProduct.name.trim().toLowerCase());
             console.log("deleted old folder and image inside ",oldPublicPath)

        } catch (error) {
            console.error('Error moving image in Cloudinary:', error);
        }
      }));

     }

     const newSize = req.body['newSize[]'] || [];


    // Update the product properties based on the form data
    existingProduct.description       =     req.body.description;
    existingProduct.name              =     req.body.name;
    existingProduct.price             =     req.body.price;
    existingProduct.stock_quantity    =     req.body.stock_quantity;
    existingProduct.material          =     selected_material;
    existingProduct.category          =     selected_category;
    existingProduct.sizes             =     newSize;

    existingProduct.discount = {
      active: req.body.discount_active === 'on' || false,
      percentage: req.body.percentage || 0,
      start_date: req.body.start_date || new Date(),
      end_date: req.body.end_date || new Date()
    }

    console.log("existingProduct.discount", existingProduct.discount);
     // Update images
    const existingImages = req.body['existingImages[]'];

    const existingImagesArray = Array.isArray(existingImages) ?
      existingImages : existingImages ? existingImages.split(',') : [];

    // Combine existing and new image names
    let mergedImages = existingImagesArray;

    if (hasProductDetailsChanged) {
      mergedImages = existingImagesArray.map(img => {
          return img.replace(oldFolder, newFolder);
      });

  }

    // Remove duplicates from the mergedImages array
    mergedImages = [...new Set(mergedImages)];


    const newImages = req.files && (Array.isArray(req.files.images)
    ? req.files.images
    : [req.files.images]) || [];

    // Upload new images to Cloudinary
    await Promise.all(newImages.map(async (image) => {
      try {

        const base64Data = image.data.toString('base64');

        // Construct folder path based on product type and subcategory
        const folder = `${selected_material}/${selected_category}/${req.body.name.trim().toLowerCase()}`;

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(`data:${image.mimetype};base64,${base64Data}`, {
          folder: folder,
          resource_type: 'image'
        });
        mergedImages.push(result.secure_url);
        updatedImageUrls.push(result.secure_url)
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
      }
    }));
    updatedImageUrls = updatedImageUrls.concat(existingProduct.images); 

    const updatedIdentifiers1 = [];
    const updatedIdentifiers2 = [];


    [updatedImageUrls, mergedImages].forEach(imageUrls => {
      imageUrls.forEach(url => {
        const publicId = url.split('/').pop().split('.')[0];
        if (imageUrls === updatedImageUrls) {
          updatedIdentifiers1.push(publicId);
        } else {
          updatedIdentifiers2.push(publicId);
        }
      });
    });

    let deletedImagesId = updatedIdentifiers1.filter(identifier => !updatedIdentifiers2.includes(identifier));

    // Remove duplicates
    deletedImagesId = [...new Set(deletedImagesId)];

    if (deletedImagesId.length !== 0) {
      deletedImagesId.forEach( async (imgId) =>{
        try {
          const publicPath = `${selected_material}/${selected_category}/${req.body.name.trim().toLowerCase()}/${imgId}`;
  
         //Delete image from Cloudinary
          await cloudinary.uploader.destroy(publicPath);
  
  
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);  
        }
      })
    }
       

    existingProduct.images = mergedImages || [];

 

    // Check if the folder is empty after deleting the image, then delete it
    if (mergedImages.length === 0) {
     await deleteEmptyFolders(existingProduct.material, existingProduct.category, existingProduct.name.trim().toLowerCase());
    }


    // Saving details to database based on user input 

    const detailsKeyRaw = req.body['detailsKey[]'];
    const detailsValueRaw = req.body['detailsValue[]'];


    const detailsKey = Array.isArray(detailsKeyRaw) && detailsKeyRaw.length > 0
      ? detailsKeyRaw.map(key => key.trim()) 
      : [];

    const detailsValue = Array.isArray(detailsValueRaw) && detailsValueRaw.length > 0
      ? detailsValueRaw.map(value => value.trim()) 
      : [];

    const mergedDetails = {};

    if (detailsKey && detailsValue) {
      for (let i = 0; i < detailsKey.length; i++) {
        if (detailsKey[i]) {
          mergedDetails[detailsKey[i]] = detailsValue[i] || '';
        } 
      }
    }

    existingProduct.details = mergedDetails;

    // Save the updated product to the database
    await existingProduct.save();

    // Redirect or render the view as needed
    res.redirect('/admin/update-product/' + productId);
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};

const Image = require('../models/Images');  // Images.js

exports.renderCategories = async (req, res) => {
  try {
    const user = req.user;


    const { materials, categories } = await getCategories(); 

    const material_data = await Image.find({});
    // const imagesData = await Image.find({ material: { $in: materials } });

    res.render('admin/categories.ejs', {layout: 'layouts/admin', title: "Categories",  user, material_data, materials, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const original_material = req.params.material; // Original material
    const updated_material = req.body.material; // Updated material from the form

    // Fetch the existing products from the database based on the original category
    const existingProducts = await Product.find({ material: original_material });  

    for (const existingProduct of existingProducts) {
      existingProduct.material = updated_material;

      await existingProduct.save();
    }

    // Redirect to the appropriate page after updating
    res.redirect('/admin/categories');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška!' });
  }
};



exports.updateCategory = async (req, res) => {
  try {
    const original_category = req.params.category; // Original category
    const updated_category = req.body.category; // Updated category from the form

    // Fetch the existing products from the database based on the original category
    const existingProducts = await Product.find({ category: original_category });  

    // Update the category and subcategory properties for each existing product based on the form data
    for (const existingProduct of existingProducts) {
      existingProduct.category = updated_category;

      await existingProduct.save();
    }

    // Redirect to the appropriate page after updating
    res.redirect('/admin/categories');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška!' });
  }
};


exports.addCategoryImg = async (req, res) => {
  try {

    let description = req.body.description;
    const material = req.body.material_img;

    if (!description || typeof description !== 'string') {
      throw new Error('Opis nije valjan!');
    }

    description = description.trim();

    const material_desc = new Image({
      material: material,
      description: description
     });

     await material_desc.save();  

     console.log("spremljeno",material_desc);

    // const { materials } = await getCategories(); 

    // const imagesData = await Image.find({ material: { $in: materials } });

      // File upload
      // if (req.files && req.files.images) {
      //     const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      //     const material = req.body.material_img; // Extract the selected material from the form

      //     const imageDoc = new Image({ material }); // Create an image document with the selected material

      //     // Upload each image to Cloudinary
      //     await Promise.all(images.map(async (image) => {
      //         const base64Data = image.data.toString('base64');
      //         // Upload image to Cloudinary with the specified folder
      //         const result = await cloudinary.uploader.upload(`data:${image.mimetype};base64,${base64Data}`, {
      //             folder: 'public',
      //             resource_type: 'image'
      //         });
      //         // Store the URL of the uploaded image in the database
      //         imageDoc.images_url.push(result.secure_url);
      //     }));

      //     await imageDoc.save();


      //     // res.redirect('/admin/categories?success');

      //     res.json({
      //       message: "Uspješno su dodane slike!",
      //       materials: materials,
      //       images: imagesData
      //     })
      // } else {
      //   res.json({
      //     message: "Nuspješno dodavanje slika!",
      //     materials: materials,
      //     images: imagesData
      //   });
      // }
    res.json({
              message: "Opis je uspješno dodan!",
              material_desc
            })

  } catch (error) {
      console.log("Greška!", error)
      res.status(500).send('Greška!');
  }
}


// let headerImageUrl = ''; 

// exports.uploadHeaderImage = async (req, res) => {
//   try {
//     console.log("req.files", req.files);

//       if (req.files && req.files.header_image) {
//         headerImageUrl = req.files.header_image;
//         const base64Data = headerImageUrl.data.toString('base64');
//           // Upload header image to Cloudinary
//           const result = await cloudinary.uploader.upload(`data:${headerImageUrl.mimetype};base64,${base64Data}`, {
//               folder: 'header_img',
//               resource_type: 'image'
//           });
//           headerImageUrl = result.secure_url; // Update header image URL with Cloudinary URL

//           res.locals.header_image = headerImageUrl; 
//           res.redirect('/admin/categories?success-header');
//       } else {
//           res.status(400).send('No header image uploaded.');
//       }


//       console.log("headerImageUrlheaderImageUrlheaderImageUrl", headerImageUrl)
//   } catch (error) {
//       console.log("Greška!", error);
//       res.status(500).send('Greška!');
//   }
// };



exports.renderOrders = async (req, res) => {
  try {
    const user = req.user;

    const orders = await Order.find();

    res.render('admin/orders.ejs', {layout: 'layouts/admin', title: "Orders",  user, orders });
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};

exports.renderOrder = async (req, res) => {
  try {
    const user = req.user;
    const order_id = req.params.order_id;

    const order = await Order.findById(order_id);

    res.render('admin/order.ejs', {layout: 'layouts/admin', title: "Order",  user, order });
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};


exports.changeOrderStatus = async (req, res) => {
  try {
    const order_id = req.params.order_id;
    const order = await Order.findById(order_id);

    const order_status = req.body.order_status;


       // Check if the order status transition requires updating product quantities
       if (order_status === 'Na putu') {
       // Iterate through order items to update product quantities
       for (const item of order.cart_items) {
           const product = await Product.findById(item.product.id);

           // If product exists and both quantity and stock_quantity are valid numbers
           if (product && !isNaN(item.quantity) && !isNaN(product.stock_quantity)) {
               // Update stock quantity
               product.stock_quantity -= item.quantity;
               await product.save();
           }
       }
   }


    order.status = order_status;
    order.save();

    res.json({ message: "Status promjenjen.", order });

  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
}


exports.cancelOrder = async (req, res) =>{
try {
    const order_id = req.params.order_id;
    const user = req.user;

    // Check for valid order id
    if (!order_id) 
      return res.status(400).json({error: 'Narudžba već ne postoji!'});

    // Check if order exists
    const order = await Order.findById(order_id);
    if (!order) 
      return res.status(404).json({ error: 'Narudžba nije pronađena!' });
    
    // Delete target order
    await order.deleteOne();
    
    // Fetch updated list of orders
    const orders = await Order.find({'user.email' : user.email})
    
    // Respond with success message and updated list of orders
    return res.json({
      orders: orders || [],
      message: 'Narudžba je uspješno poništena!'});

  } catch (error) {
    // Log the error
    console.error(error);
    return res.status(500).send('Greška!');
  }

}

exports.deleteOrder = async (req, res) => {
  try {
    const order_id = req.params.order_id;

    // Check for valid order id
    if (!order_id) 
      return res.status(400).json({ error: 'Nevažeći ID narudžbe!' });
    

    // Check if order exists
    const order = await Order.findById(order_id);
    if (!order) 
      return res.status(404).json({ error: 'Narudžba nije pronađena!' });
    

    // Delete the order
    await order.deleteOne();

    // Fetch updated list of orders
    const orders = await Order.find({});

    // Respond with success message and updated list of orders
    return res.json({
      orders: orders || [],
      message: 'Narudžba je uspješno poništena!'
    });

  } catch (error) {
    // Log the error
    console.error(error);
    return res.status(500).send('Greška!');
  }
}


exports.setDiscount = async (req, res) => {
  try {

    const { selectedProducts,
            percentage,
            start_date, end_date,
            discount_active } = req.body;

    
    await Product.updateMany(
      { _id: { $in: selectedProducts } },
      {
        discount: {
          active: discount_active === 'on' || false,
          percentage: percentage || 0,
          start_date: start_date || new Date(),
          end_date: end_date || new Date()
        }
      }
    );

    res.redirect('/admin/list-products?success');


  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
}
