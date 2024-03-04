// adminController.js
const User = require('../models/User');  // User.js
const Product = require('../models/Product');  // Product.js
const Cart = require('../models/Cart');  // Product.js
const mongoose = require('mongoose');


// An asynchronous function to fetch product types and subcategories
const getCategories = async () => {
  // Hardcoded default values for product types and subcategories
  const PRODUCT_TYPE = ["Diamond", "Silver", "Gold"];
  const SUBCATEGORIES = ["Necklace", "Ring", "Chain", "Earring", "Bracelet"];

  // Fetch unique product types from the database
  const product_types_found = await Product.distinct('product_type');

  // Use the found product types if they exceed or equal the hardcoded defaults,
  // otherwise, use the hardcoded defaults
  // const product_types = product_types_found.length >= PRODUCT_TYPE.length
  //   ? product_types_found
  //   : PRODUCT_TYPE;
  const product_types = product_types_found;
  // Fetch unique subcategories from the database
  const subcategories_found = await Product.distinct('subcategory');
  const subcategories = subcategories_found;

  // Use the found subcategories if they exceed or equal the hardcoded defaults,
  // otherwise, use the hardcoded defaults
  // const subcategories = subcategories_found.length >= SUBCATEGORIES.length
  //   ? subcategories_found
  //   : SUBCATEGORIES;

  // Return an object containing the product types and subcategories
  return { product_types, subcategories };
};







exports.dashboard = (req, res) => {
  let user = req.user;

  res.render('admin/dashboard.ejs', { layout: 'layouts/admin', title: 'Dashboard', user })
};

exports.listUsers = async (req, res) => {
  try {
    let user = await User.find({});
    const user_roles = ['regular_user', 'admin'];

    res.render('admin/list-users.ejs', { layout: 'layouts/admin', title: 'Users',  user, user_roles })

  } catch (error) {
    res.status(500).send({ message: error.message });
  }

};

exports.updateUserRole = async (req, res) =>{
  try {
    const userId = req.params.user_id;
    const userToUpdate = await User.findById(userId);
    
    if (!userToUpdate) {
      return res.status(404).send('User not found');
    }
    if (userToUpdate._id.toString() === req.user._id.toString()) {
      return res.status(403).send('You can\'t change your own role');
    }

    userToUpdate.role = req.body.user_role;
    userToUpdate.updated_at = new Date();

    await userToUpdate.save();

    res.status(200).send('User role updated successfully');

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}



exports.deleteUser = async (req, res) => {
  try {
    // Extract user ID from the request parameters
    const userId = req.params.user_id;

    // Check if the logged-in user is an admin
    const loggedInUser = req.user; 
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      return res.status(403).send('Permission denied');
    }

    // Check if the user with the given userId exists
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).send('User not found');
    }

    // Remove the user from the database
    await userToDelete.deleteOne({ _id: new mongoose.Types.ObjectId(userId) });

    res.status(200).send('User deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


exports.listProducts = async (req, res) => {
  let user = req.user;

  const products = await Product.find({})

  res.render('admin/list-products.ejs', { layout: 'layouts/admin', title: 'List Users', user , products})
};




async function deleteEmptyFolders(product_type, subcategory, name) {
  try {
      const folderStructure = [
          `${product_type}/${subcategory}/${name}`,
          `${product_type}/${subcategory}`,
          product_type
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
     
     // Delete associated cart items
     await Cart.updateMany(
      { 'items.product': new mongoose.Types.ObjectId(product_id) },
      { $pull: { items: { product: new mongoose.Types.ObjectId(product_id) } } },
      { multi: true }
     );
     
      // Delete associated images from Cloudinary
      if (product.images && product.images.length > 0) {
        await Promise.all(product.images.map(async (imageUrl) => {
          try {
            // Extract public_id from the Cloudinary URL
            const publicId = imageUrl.split('/').pop().split('.')[0];
            const publicPath = `${product.product_type}/${product.subcategory}/${product.name.trim().toLowerCase()}/${publicId}`;

            // Delete image from Cloudinary
            await cloudinary.uploader.destroy(publicPath);

            console.log('Deleted image from Cloudinary1:', publicPath);

          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
          }
        }));
      }


    await deleteEmptyFolders(product.product_type, product.subcategory, product.name.trim().toLowerCase());
        

    res.redirect('/admin/list-products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};



exports.renderAddProductForm = async (req, res) => {
  try {
    const user = req.user;

    const { product_types, subcategories } = await getCategories(); 

    res.render('admin/add-product.ejs', {layout: 'layouts/admin', title: "Add Product",  user, product_types, subcategories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
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
            stock_quantity, check_new_product_type,
            check_new_subcategory,
            product_type,
            subcategory,
            new_product_type,
            new_subcategory
             } = req.body;

    const detailsKey = req.body['detailsKey[]'];
    const detailsValue = req.body['detailsValue[]'];
    const sizes = req.body['newSize[]'];

    console.log("newSize",sizes)

    const selectedProductType = check_new_product_type ? new_product_type.trim() : product_type;

    // Use the selected or newly entered subcategory
    const selectedSubcategory = check_new_subcategory ? new_subcategory.trim() : subcategory;
    
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
      product_type: selectedProductType,
      subcategory: selectedSubcategory,
      details: details,
      sizes: sizes
    });


  // File upload
  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

   // Upload each image to Cloudinary
   await Promise.all(images.map(async (image) => {

     const base64Data = image.data.toString('base64');
     // Construct folder path based on product type and subcategory
     const folder = `${selectedProductType}/${selectedSubcategory}/${name.trim().toLowerCase()}`;

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
    res.status(500).send('Server Error');
  }
};




exports.renderUpdateProduct = async (req, res) => {
  try {
    const user = req.user;

    let productId = req.params.productId;
    const { product_types, subcategories } = await getCategories(); 

    const product = await Product.findById(productId);

    res.render('admin/update-product.ejs', {layout: 'layouts/admin', title: "Update Product", product, user, product_types, subcategories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


exports.updateProduct = async (req, res) => {
  try {


    const productId = req.params.productId;

    // Fetch the existing product from the database
    const existingProduct = await Product.findById(productId);

    const { check_new_product_type,
            check_new_subcategory,
            new_product_type,
            new_subcategory
       } = req.body;

    // Use the selected or newly entered produc
    const selectedProductType = check_new_product_type ? new_product_type.trim() : req.body.product_type;
    // Use the selected or newly entered subcategory
    const selectedSubcategory = check_new_subcategory ? new_subcategory.trim() : req.body.subcategory;

    console.log("selectedProductType",selectedProductType)
    console.log("selectedSubcategory",selectedSubcategory)


    // Determine changes in product details
    const hasProductDetailsChanged = existingProduct.product_type != selectedProductType ||
                                     existingProduct.subcategory != selectedSubcategory ||
                                     existingProduct.name != req.body.name;

    // Array to hold updated image URLs
    let updatedImageUrls = [];

    // Construct old and new folder paths
    const oldFolder = `${existingProduct.product_type}/${existingProduct.subcategory}/${existingProduct.name.trim().toLowerCase()}`;
    const newFolder = `${selectedProductType}/${selectedSubcategory}/${req.body.name.trim().toLowerCase()}`;

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

             await deleteEmptyFolders(existingProduct.product_type, existingProduct.subcategory, existingProduct.name.trim().toLowerCase());
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
    existingProduct.product_type      =     selectedProductType;
    existingProduct.subcategory       =     selectedSubcategory;
    existingProduct.sizes             =     newSize;

    console.log("newSize",newSize)

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
    console.log("newImages", newImages)

    // Upload new images to Cloudinary
    await Promise.all(newImages.map(async (image) => {
      try {

        const base64Data = image.data.toString('base64');

        // Construct folder path based on product type and subcategory
        const folder = `${selectedProductType}/${selectedSubcategory}/${req.body.name.trim().toLowerCase()}`;

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(`data:${image.mimetype};base64,${base64Data}`, {
          folder: folder,
          resource_type: 'image'
        });
        console.log('Uploaded image:', result.secure_url);
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
          const publicPath = `${selectedProductType}/${selectedSubcategory}/${req.body.name.trim().toLowerCase()}/${imgId}`;
  
         //Delete image from Cloudinary
          await cloudinary.uploader.destroy(publicPath);
  
          console.log('Deleted image from Cloudinary3:', publicPath);
  
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);  
        }
      })
    }
       

    existingProduct.images = mergedImages || [];
    console.log("existingProduct.imagesFinal", existingProduct.images)

 

    // Check if the folder is empty after deleting the image, then delete it
    if (mergedImages.length === 0) {
     await deleteEmptyFolders(existingProduct.product_type, existingProduct.subcategory, existingProduct.name.trim().toLowerCase());
    }


    //////////////////////////////////////////////////////////////
    // Saving details to database based on user input 

    const detailsKeyRaw = req.body['detailsKey[]'];
    const detailsValueRaw = req.body['detailsValue[]'];

    console.log("detailsKeyRaw", detailsKeyRaw)
    console.log("detailsValueRaw", detailsValueRaw)

    const detailsKey = Array.isArray(detailsKeyRaw) && detailsKeyRaw.length > 0
      ? detailsKeyRaw.map(key => key.trim()) 
      : [];
      console.log("detailsKey", detailsKey)

    const detailsValue = Array.isArray(detailsValueRaw) && detailsValueRaw.length > 0
      ? detailsValueRaw.map(value => value.trim()) 
      : [];
      console.log("detailsValue", detailsValue)

    const mergedDetails = {};

    if (detailsKey && detailsValue) {
      for (let i = 0; i < detailsKey.length; i++) {
        if (detailsKey[i]) {
          mergedDetails[detailsKey[i]] = detailsValue[i] || '';
        }
      }
    }
    console.log("mergedDetails", mergedDetails)

    existingProduct.details = mergedDetails;

    // Save the updated product to the database
    await existingProduct.save();

    // Redirect or render the view as needed
    res.redirect('/admin/update-product/' + productId);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


exports.renderCategories = async (req, res) => {
  try {
    const user = req.user;

    const { product_types, subcategories } = await getCategories(); 

    res.render('admin/categories.ejs', {layout: 'layouts/admin', title: "Categories",  user, product_types, subcategories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.updateProductType = async (req, res) => {
  try {
    const originalProductType = req.params.product_type; // Original ProductType
    const updatedProductType = req.body.product_type; // Updated ProductType from the form

    // Fetch the existing products from the database based on the original category
    const existingProducts = await Product.find({ product_type: originalProductType });  

    for (const existingProduct of existingProducts) {
      existingProduct.product_type = updatedProductType;

      await existingProduct.save();
    }

    // Redirect to the appropriate page after updating
    res.redirect('/admin/categories');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};



exports.updateSubcategory = async (req, res) => {
  try {
    const originalSubcategory = req.params.subcategory; // Original category
    const updatedSubcategory = req.body.subcategory; // Updated category from the form

    // Fetch the existing products from the database based on the original category
    const existingProducts = await Product.find({ subcategory: originalSubcategory });  

    // Update the category and subcategory properties for each existing product based on the form data
    for (const existingProduct of existingProducts) {
      existingProduct.subcategory = updatedSubcategory;

      await existingProduct.save();
    }

    // Redirect to the appropriate page after updating
    res.redirect('/admin/categories');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};



