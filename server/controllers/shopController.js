// shopController.js

const Review = require('../models/Review');  // Review.js  

const User =       require('../models/User');  // User.js
const Product =    require('../models/Product'); // Product.js
const Cart =       require('../models/Cart'); // Cart.js
const Order = require('../models/Order'); // Order.js

require('../models/database');


// Set first char of string to upper case
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to validate email format
function validateEmail(email) {
  // Regular expression to validate email format
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}


/**
 * GET /
 * Homepage
*/
exports.home = async (req, res) => {
  try {
    // const categories = await Category.find({});
    const products = await Product.find({});

    const product_types = await Product.distinct('product_type');
    const subcategories = await Product.distinct('subcategory');

    const subcategoriesMap = new Map();

    for (const type of product_types) {
      const distinctSubcategories = await Product.distinct('subcategory', { product_type: type });
      subcategoriesMap.set(type, distinctSubcategories);
    }

    // Check if a user is logged in
    // Check if user exists
    const user = req.user;


    res.render('index.ejs', { title: 'eCommerce - Home', products, user, product_types, subcategories , subcategoriesMap,  currentPath: req.path });
  } catch (error) {
    res.status(500).send({ message: error.message || 'Error Occurred' });
  }
};



exports.renderByCategory = async (req, res) => {
  try {
    const category = capitalizeFirstLetter(req.params.category);
    const user = req.user;

 
    const product = await Product.find({ product_type: category });

    res.render('product_type.ejs', { title: category, product, user });

  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

exports.renderByCategory_subcategory = async (req, res) => {
  try {
    const user = req.user;

    const category = capitalizeFirstLetter(req.params.category);
    const subcategory = capitalizeFirstLetter(req.params.subcategory);

    const product = await Product.find( { product_type: category , subcategory: subcategory});

    res.render('material-subcategory.ejs', { title: category, product, user });

  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}



exports.profil = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      // Redirect to the login page if the user is not logged in
      res.redirect('/login'); 
      return;
    }
    const user = req.user;

    res.render('profil.ejs', { title: 'eCommerce - Profil', user });
  } catch (error) {
    res.status(500).send({ message: error.message || 'Error Occurred' });
  }
}


exports.updateUser = async (req, res) => {
  try {
    // Retrieve the user from the database
    const user = await User.findById(req.params.user_id);

    // Check if the user exists
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Destructure request body
    const {
          profil_username,   profil_username_checkbox,
          profil_first_name, profil_first_name_checkbox,
          profil_last_name,  profil_last_name_checkbox,
          profil_email,      profil_email_checkbox,
          profil_address,    profil_address_checkbox,
          profil_phone,      profil_phone_checkbox
          } = req.body;


    // Check if the email is being changed and if it already exists
    if (profil_email_checkbox) {
      // Validate inputs (for simplicity, you can add more specific validation logic)
      if (!profil_email || !validateEmail(profil_email)) {
        return res.status(400).send('Invalid email');
      }

      const existingUser = await User.findOne({ email: profil_email });
      if (existingUser && existingUser._id.toString() !== req.params.user_id) {
        return res.status(400).send('Email already exists');
      }
    }

    // Update user information
    user.username = profil_username_checkbox ? profil_username : user.username;
    user.first_name = profil_first_name_checkbox ? profil_first_name : user.first_name;
    user.last_name = profil_last_name_checkbox ? profil_last_name : user.last_name;
    user.email = profil_email_checkbox ? profil_email : user.email;
    user.address = profil_address_checkbox ? profil_address : user.address;
    user.phone = profil_phone_checkbox ? profil_phone : user.phone;
    user.updated_at = new Date();

    // Save updated user
    await user.save();

    // Redirect to profile page
    res.redirect('/profil');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};








/**
 * GET /products
 * Display all products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const user = req.user;

    const product_types = await Product.distinct('product_type');
    const subcategories = await Product.distinct('subcategory');

    const limit = parseInt(req.query.limit) || 3;
    // Find products based on the selected product types and subcategories
    const selectedTypes = [].concat(req.query.productType).filter(Boolean);
    const selectedSubcategories = [].concat(req.query.subcategory).filter(Boolean);

    // Find products based on the selected product types and subcategories
    let query = {};

    // Build the query based on the selected product types and subcategories
    if (selectedTypes.length && selectedSubcategories.length) {
      query = {
        $and: [
          { product_type: { $in: selectedTypes } },
          { subcategory: { $in: selectedSubcategories } }
        ]
      };
    } else if (selectedTypes.length) {
      query = { product_type: { $in: selectedTypes } };
    } else if (selectedSubcategories.length) {
      query = { subcategory: { $in: selectedSubcategories } };
    }

    // Find products based on the constructed query

      const products = await Product.find(query)
      // const products = await Product.find(query).limit(limit);
      
    // Check if it's an AJAX request

    // if (req.xhr || req.headers.accept.includes('json')) {
    //   // If it's an AJAX request, send JSON response
    //   res.json(products);
    // } else {
      // If it's a regular request, render the page with products
      res.render('products.ejs', { title: 'Filtered Products', selectedSubcategories, selectedTypes, user, products, product_types, subcategories });
    // }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};



exports.getSpecificProduct = async (req, res) => {
  try {
    const user = req.user;

    let product_id = req.params.product_id;

    const parts = product_id.split('-');
    const actualProductId = parts[parts.length - 1];


    const product = await Product.findById(actualProductId);
    const review = await Review.find({ product_id: actualProductId }).populate('user_id');
    console.log("review",review)
    res.render('product.ejs', { title: product.name, product, user, review });

  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}

exports.addComment = async (req, res) =>{
  try {
    if (!req.isAuthenticated()) {
      // Redirect to the login page if the user is not logged in
      res.redirect('/login'); 
      return;
    }

    const { comment, rating  } = req.body;
    const product_id = req.params.product_id;
   
    const user = req.user;

    // Create a new comment
     const newReview = new Review({
       user_id: user._id, 
       product_id,
       rating,
       comment,
     });

    // Save the new comment
     await newReview.save();

     // res.redirect(`/products/${product_id}`);
     // Redirect back to the product page
    res.redirect('back');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}
exports.deleteComment = async (req, res) =>{
  try {
    // Get comment from post route 
    const comment_id = req.params.comment_id;

    // Find the comment by ID
    const comment = await Review.findById(comment_id);

    console.log("req.user.role",req.user.role)
    // Check if the logged-in user is the owner of the comment or administrator
    if (comment 
        && comment.user_id.toString() === req.user._id.toString()
        || req.user.role === 'admin') {
      // Delete the comment
      await Review.findByIdAndDelete(comment_id);
      // Redirect back to the product page
      return res.redirect('back');
    } else {
      // If the user is not the owner of the comment, or the comment doesn't exist, return an error
      return res.status(403).send('Unauthorized');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}


exports.cart = async (req, res) => {
  try {

    // Ensure the user is logged in
    if (!req.isAuthenticated()) {
      res.redirect('/login'); // Redirect to the login page if the user is not logged in
      return;
    }

    // Retrieve the user with populated cart and items
    const user = await User.findById(req.user._id)
      .populate({
        path: 'cart',
        populate: {
          path: 'items.product',
          model: 'Product', 
        },
      })
      .exec();


    // Render the cart template with the populated user object
    res.render('cart.ejs', { title: 'Cart', user });
  } catch (error) {
    console.error(error);
    res.status(500).send(error + "\tServer Error");
  }
}




exports.addToCart = async (req, res) => {
  try {
    const user = req.user; // Access the authenticated user

    // Extract productId and quantity from the request body
    const { productId, quantity } = req.body;

    // Find or create the user's cart
    let userCart = await Cart.findOne({ user: user._id });

    if (!userCart) {
      userCart = new Cart({ user: user._id, items: [] });
      await userCart.save();
      user.cart = userCart._id;
      await user.save();
    }

    // Check if the product is already in the cart
    const existingItem = userCart.items.find((item) => item.product.equals(productId));

    if (existingItem) {
      // If the product is already in the cart, increment the quantity
      existingItem.quantity += parseInt(quantity);
    } else {
      // If the product is not in the cart, add a new item
      userCart.items.push({ product: productId, quantity: parseInt(quantity) });
    }

    // Save the updated cart
    await userCart.save();

    res.redirect('/cart'); // Redirect to the cart page or any other desired page
  } catch (error) {
    console.error(error);


    res.status(500).send(error + "\tServer Error");
  }
};


exports.removeFromCart = async (req, res) => {
  try {
    const user = req.user; // Access the authenticated user
    const productIdToRemove = req.body.productId || req.params.productId;

    // Check if the user is logged in and the product ID is valid
    if (user && productIdToRemove) {
      // Remove the item from the cart based on the product ID
      await Cart.updateOne(
        { user: user._id },
        { $pull: { items: { product: productIdToRemove } } }
      );

      console.log('Item removed successfully');
      res.redirect('/cart');
    }
  } catch (error) {
    console.error(error);


    res.status(500).send(error + "\tServer Error");
  }
};

exports.checkout = async (req, res) => {
  try {
    const { userId, cartId, shippingAddress, paymentDetails } = req.body;

    const order = new Order({
      user: userId,
      cart: cartId,
    })
  } catch (error) {
    console.error(error);


    res.status(500).send(error + "\tServer Error");
  }
};

exports.delivery = async (req, res) => {
  try {
    const user = req.user;

    res.render('delivery.ejs', { title: 'Deliver', user });
  } catch (error) {
    console.error(error);


    res.status(500).send(error + "\tServer Error");
  }
};




/**
 * GET /contact
 * Contact
 */
exports.contact = async (req, res) => {
  const user = req.user;
  res.render('contact.ejs', { title: 'eCommerce - Contact', user });
}

/**
 * GET /about
 * About
 */
exports.about = async (req, res) => {
  const user = req.user;

  res.render('about.ejs', { title: 'eCommerce - About', user });
}




//  const productsData = [
//    {
//     name: 'Diamond Necklace',
//     description: 'A stunning diamond necklace.',
//     price: 450,
//     stock_quantity: 50,
//     images: ["diamant-narukvica-1.jpg", "diamant-narukvica-1.jpg"],
//     product_type: 'Diamond',
//     subcategory: 'Necklace',
//     details: {
//       material: 'Platinum',
//       diamonds: {
//         carat: 2.5,
//         cut: 'Round Brilliant',
//         color: 'D',
//         clarity: 'IF',
//       },
//       length: '18 inches',
//       weight: 10,
//     },
//    },
//    {
//      name: "Gold Necklace",
//      description: "A stunning gold necklace.",
//      price: 350,
//      stock_quantity: 50,
//      images: ["diamant-narukvica-4.jpg", "diamant-narukvica-1.jpg"],
//      product_type: 'Gold',
//      subcategory: 'Necklace',
//      details: {
//        material: 'Platinum',
//        diamonds: {
//          carat: 2.5,
//          cut: 'Round Brilliant',
//          color: 'D',
//          clarity: 'IF',
//        },
//        length: '18 inches',
//        weight: 10,
//      },
//    },
//    {
//      name: "Diamond Necklace",
//      description: "A stunning diamond necklace.",
//      price: 500,
//      stock_quantity: 50,
//      images: ["diamant-narukvica-3.jpg", "diamant-narukvica-4.jpg"],
//      product_type: 'Diamond',
//      subcategory: 'Necklace',
//      details: {
//        material: 'Platinum',
//        diamonds: {
//          carat: 2.5,
//          cut: 'Round Brilliant',
//          color: 'D',
//          clarity: 'IF',
//        },
//        length: '18 inches',
//        weight: 10,
//      },
//    },
//    {
//      name: "Gold Necklace",
//      description: "A stunning gold necklace.",
//      price: 200,
//      stock_quantity: 50,
//      images: ["diamant-narukvica-2.jpg", "diamant-narukvica-1.jpg"],
//      product_type: 'Gold',
//      subcategory: 'Necklace',
//      details: {
//        material: 'Platinum',
      
//        length: '18 inches',
//        weight: 10,
//      },
//    },
//    {
//      name: "Silver Necklace",
//      description: "A stunning silver necklace.",
//      price: 150,
//      stock_quantity: 50,
//      images: ["diamant-narukvica-3.jpg", "diamant-narukvica-4.jpg"],
//      product_type: 'Silver',
//      subcategory: 'Necklace',
//      details: {
//        material: 'Platinum',
      
//        length: '18 inches',
//        weight: 10,
//      },
//    },
//    {
//      name: "Diamond Necklace",
//      description: "A stunning diamond necklace.",
//      price: 340,
//      stock_quantity: 50,
//      images: ["diamant-narukvica-1.jpg", "diamant-narukvica-1.jpg"],
//      product_type: 'Diamond',
//      subcategory: 'Necklace',
//      details: {
//        material: 'Platinum',
//        diamonds: {
//          carat: 2.5,
//          cut: 'Round Brilliant',
//          color: 'D',
//          clarity: 'IF',
//        },
//        length: '18 inches',
//        weight: 10,
//      },
//    },
//    {
//      name: "Silver Necklace",
//      description: "A stunning silver necklace.",
//      price: 380,
//      stock_quantity: 50,
//      images: ["diamant-narukvica-3.jpg", "diamant-narukvica-4.jpg"],
//      product_type: 'Silver',
//      subcategory: 'Necklace',
//      details: {
//        material: 'Platinum',
//        length: '18 inches',
//        weight: 10,
//      },
//    },
//    
//  ];
//  // Insert products into the database
//  async function insertProducts() {
//    try {
//      await Product.deleteMany({});
//      console.log('Old products deleted successfully');
//      await Product.insertMany(productsData);
//      console.log('New products inserted successfully');
//    } catch (error) {
//      console.error('Error inserting products:', error);
//    }
//  }
// //  insertProducts();