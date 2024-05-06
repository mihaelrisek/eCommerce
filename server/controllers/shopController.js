// shopController.js

const Review = require('../models/Review');  // Review.js  

const User =       require('../models/User');  // User.js
const Product =    require('../models/Product'); // Product.js
const Order = require('../models/Order'); // Order.js
const Image = require('../models/Images'); 
const { capitalizeFirstLetter,
  validateEmail} = require('../functions/func');
  

/**
 * GET /
 * Homepage
*/
exports.home = async (req, res) => {
  try {
    const products = await Product.find({});

    const materials = await Product.distinct('material');
    const categories = await Product.distinct('category');

    const categoriesMap = new Map();

    for (const material of materials) {
      const distinct_categories = 
        await Product.distinct('category', { material: material });
        categoriesMap.set(material, distinct_categories);
    }

    const material_data = await Image.find({});

    const user = req.user;

    res.render('index.ejs', 
    { title: 'Lato \u2022 Pocetna', products,
      material_data, user, materials, categories,
      categoriesMap,  currentPath: req.path });
  } catch (error) {
    res.status(500).send({ message: error.message || 'Greška!' });
  }
};



exports.renderByMaterial = async (req, res) => {
  try {
    const material = capitalizeFirstLetter(req.params.material);
    const user = req.user;
 
    const product = await Product.find({ material: material });

    res.render('material.ejs', {  currentPath: '/products', title: 'Lato \u2022 ' + material, product, user });

  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

exports.renderByMaterialAndCategory= async (req, res) => {
  try {
    const user = req.user;

    const material = capitalizeFirstLetter(req.params.material);
    const category = capitalizeFirstLetter(req.params.category);

    const product = await Product.find( { material: material , category: category});

    res.render('material-category.ejs', { currentPath: '/products', title: 'Lato \u2022 ' + category, product, user });

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

    const orders = await Order.find({
      $and: [
        { 'user.email': user.email },
        {  status: { $ne: 'Otkazano' } } 
      ]})


    res.render('profil.ejs', { title: 'Lato \u2022 Moj racun', user, orders });
  } catch (error) {
    res.status(500).send({ message: error.message || 'Greška!' });
  }
}


exports.viewOrder = async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.redirect('/');
   
    const user = req.user;
    const order_id = req.params.order_id;

    const order = await Order.findById(order_id);

    res.render('order.ejs', { title: "Order",  user, order });
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
  }
};



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
          profil_first_name,        profil_first_name_checkbox,
          profil_last_name,         profil_last_name_checkbox,
          profil_email,             profil_email_checkbox,
          profil_address_street,
          profil_address_city,
          profil_address_zip_code,  profil_address_checkbox,
          profil_phone,             profil_phone_checkbox
          } = req.body;


    // Check if the email is being changed and if it already exists
    if (profil_email_checkbox) {
      // Validate inputs 
      if (!profil_email || !validateEmail(profil_email)) {
        return res.status(400).send('Invalid email');
      }

      const existingUser = await User.findOne({ email: profil_email });
      if (existingUser && existingUser._id.toString() !== req.params.user_id) {
        return res.status(400).send('Email already exists');
      }
    }

    // Update user information
    user.first_name = profil_first_name_checkbox ? profil_first_name : user.first_name;
    user.last_name = profil_last_name_checkbox ? profil_last_name : user.last_name;
    user.email = profil_email_checkbox ? profil_email : user.email;
    user.address = profil_address_checkbox 
    ? {region : 'Hrvatska',
       street : profil_address_street,
       city : profil_address_city,
       zip_code : profil_address_zip_code}
     : user.address;
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

    const materials = await Product.distinct('material');
    const categories = await Product.distinct('category');

    // Find products based on the constructed query
    const limit = 6;
    const products = await Product.find().limit(limit);
   
      res.render('products.ejs', {currentPath: '/products', title: 'Lato \u2022 Proizvodi', user, products, materials, categories });
    // }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};



/**
 * POST /load_more
 * Load more products based on scroll
 */
exports.loadMoreProducts = async (req, res) => {
  try {

    // Find products based on the selected product types and subcategories
    const selected_material = [].concat(req.query.material).filter(Boolean);
    const selected_category = [].concat(req.query.category).filter(Boolean);

    // Find products based on the selected product types and subcategories
    let query = {};

    // Build the query based on the selected product types and subcategories
    if (selected_material.length && selected_category.length) {
      query = {
        $and: [
          { material: { $in: selected_material } },
          { category: { $in: selected_category } }
        ]
      };
    } else if (selected_material.length) {
      query = { material: { $in: selected_material } };
    } else if (selected_category.length) {
      query = { category: { $in: selected_category } };
    }

    // Paginate products to load more
    const skip = parseInt(req.body.skip) || 0;
    const limit = 3; // Adjust as per your requirement
    // Find products based on the constructed query with pagination
    const products = await Product.find(query).skip(skip).limit(limit);

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};



exports.filterProducts = async (req, res) =>{
  try {

      // Find products based on the selected product types and subcategories
      const selected_material = [].concat(req.body.material).filter(Boolean);
      const selected_category = [].concat(req.body.category).filter(Boolean);


  
      // Find products based on the selected product types and subcategories
      let query = {};
  
      // Build the query based on the selected product types and subcategories
      if (selected_material.length && selected_category.length) {
        query = {
          $and: [
            { material: { $in: selected_material } },
            { category: { $in: selected_category } }
          ]
        };
      } else if (selected_material.length) {
        query = { material: { $in: selected_material } };
      } else if (selected_category.length) {
        query = { category: { $in: selected_category } };
      }

      console.log("queryy",query)
    // Find products based on the constructed query
    const products = await Product.find(query);

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}




exports.getSpecificProduct = async (req, res) => {
  try {
    const user = req.user;  

    const login_url = `/login?redirect=${req.originalUrl}`;


    let product_id = req.params.product_id;

    const parts = product_id.split('-');
    const actualProductId = parts[parts.length - 1];

    const product = await Product.findById(actualProductId);

    const review = await Review.find({ product_id: actualProductId })
                               .populate('user_id');

    
    res.render('product.ejs', {currentPath: '/product', title: 'Lato \u2022 ' + product.name, product, user, review, login_url });

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


    if (!comment || typeof comment !== 'string') {
      throw new Error('Komentar nije valjan!');
    }

    comment = comment.trim();


    if (!comment || !rating || rating < 1 || rating > 5) {
      res.status(400).send('Error');
      return;
  }
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
     
     await newReview.populate('user_id');
     
     // res.redirect(`/products/${product_id}`);
     // Redirect back to the product page
     res.status(201).json(newReview);
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

    // Check if the logged-in user is the owner of the comment or administrator
    if (comment 
        && comment.user_id.toString() === req.user._id.toString()
        || req.user.role === 'admin') {
      // Delete the comment
      await Review.findByIdAndDelete(comment_id);
      // Redirect back to the product page
      return res.redirect('back');
    } else {
      // If the user is not the owner of the comment
      // or the comment doesn't exist, return an error
      return res.status(403).send('Unauthorized');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

// async function addProducts() {
//   try {
//     const products = [
//       {
//         "name": "Srebrna narukvica s ružičastim safirom",
//         "description": "Narukvica od srebra s ružičastim safirom kao centralnim kamenom.",
//         "price": 280,
//         "material": "Srebro",
//         "category": "Narukvica"
//       },
//       {
//         "name": "Zlatne naušnice s dijamantima",
//         "description": "Elegantne naušnice od 18-karatnog zlata s dijamantima.",
//         "price": 850,
//         "material": "Zlato",
//         "category": "Nausnica"
//       },
//       {
//         "name": "Diamantna broša",
//         "description": "Luksuzna broša ukrašena dijamantima.",
//         "price": 1200,
//         "material": "Diamant",
//         "category": "Broša"
//       },
//       {
//         "name": "Srebrni prsten s peridotom",
//         "description": "Prsten od srebra s peridotom kao centralnim kamenom.",
//         "price": 220,
//         "material": "Srebro",
//         "category": "Prsten",
//         "sizes": ["M", "L"]
//       },
//       {
//         "name": "Zlatna ogrlica s akvamarinom",
//         "description": "Elegantna ogrlica od 22-karatnog zlata s akvamarinom.",
//         "price": 980,
//         "material": "Zlato",
//         "category": "Ogrlica"
//       },
//       {
//         "name": "Srebrni lančić s privjeskom od ametista",
//         "description": "Lančić od srebra s prekrasnim ametistom kao privjeskom.",
//         "price": 320,
//         "material": "Srebro",
//         "category": "Lančić"
//       },
//       {
//         "name": "Diamantne naušnice s tanzanitom",
//         "description": "Naušnice s dijamantima oko tanzanita.",
//         "price": 480,
//         "material": "Diamant",
//         "category": "Nausnica"
//       },
//       {
//         "name": "Zlatni prsten s rubinom",
//         "description": "Prsten od 24-karatnog zlata s rubinom kao centralnim kamenom.",
//         "price": 1150,
//         "material": "Zlato",
//         "category": "Prsten",
//         "sizes": ["S", "M", "L"]
//       },
//       {
//         "name": "Srebrne naušnice s topazom",
//         "description": "Naušnice od srebra s topazom kao centralnim kamenom.",
//         "price": 180,
//         "material": "Srebro",
//         "category": "Nausnica"
//       },
//       {
//         "name": "Zlatna narukvica s peridotom",
//         "description": "Elegantna narukvica od 18-karatnog zlata s peridotom.",
//         "price": 750,
//         "material": "Zlato",
//         "category": "Narukvica"
//       }
//     ];

//     // Dodavanje proizvoda u bazu
//     const addedProducts = await Product.insertMany(products);
//     console.log('Products added successfully:', addedProducts);
//   } catch (error) {
//     console.error('Error adding products:', error);
//   }
// }

// addProducts();

exports.cart = async (req, res) => {
  try {

    const user = req.user;
    let cart_items = [];
    let guest_products = [];
    let user_products = [];
  
    // Check if the request has a user object
    if (user) {
       // If user is registered retrive cart_items from session storage
       cart_items = req.session.user_cart || [];
 
       // Populate user_products array with product details
       for (const item of cart_items) {
         const product = await Product.findById(item.product_id).exec();
         if (product) {
           user_products.push(product);
         }
       }
        
    } else {
       // If user is guest then  retrive cart_items from session storage
      cart_items = req.session.guest_cart || [];

      // Populate guest_products array with product details
      for (const item of cart_items) {
        const product = await Product.findById(item.product_id).exec();
        if (product) {
          guest_products.push(product);
        }
      }
    }

    // Render the cart template with the populated user object
    res.render('cart.ejs', { currentPath: '/cart', title: 'Lato \u2022 Košarica', user,
     cart_items, user_products,  guest_products });
  } catch (error) {
    console.error(error);
    res.status(500).send(error + "Greška!");
  }
}




exports.addToCart = async (req, res) => {
  try {
    // Get the authenticated user
    const user = req.user; 
    // Extract productId , quantity and sizes (optional) from the request body
    const { product_id, quantity, size } = req.body;

    if (user) {
        // Check if the user is a guest, if so, store cart items in session storage
      // Retrieve user cart from session storage or initialize an empty array
      let user_cart = req.session.user_cart || []; 

      // Find existing item in the user cart based on product ID
      const existing_item = user_cart.find(item => item.product_id === product_id);

      // If the item already exists in the user cart
      if (existing_item) {
        // Increment the quantity of the existing item by the quantity specified
        if (existing_item.size !== size)
          user_cart.push({ product_id, quantity: parseInt(quantity), size: size });
        else 
          existing_item.quantity += parseInt(quantity);

      } else {
        // Else add a new item to the cart
        user_cart.push({ product_id, quantity: parseInt(quantity), size: size });
      }

      // Update the guest cart in session storage with the modified cart
      req.session.user_cart = user_cart;

      // Redirect the user to the cart page after updating the cart
      res.redirect('/cart');
  }
  else {
      // Check if the user is a guest, if so, store cart items in session storage
      // Retrieve guest cart from session storage or initialize an empty array
      let guest_cart = req.session.guest_cart || []; 

      // Find existing item in the guest cart based on product ID
      const existing_item = guest_cart.find(item => item.product_id === product_id);

      // If the item already exists in the guest cart
      if (existing_item) {
        // Increment the quantity of the existing item by the quantity specified
        if (existing_item.size !== size)
          guest_cart.push({ product_id, quantity: parseInt(quantity), size: size });
        else
          existing_item.quantity += parseInt(quantity);

      } else {
        // Else add a new item to the cart
        guest_cart.push({ product_id, quantity: parseInt(quantity), size: size });
      }

      // Update the guest cart in session storage with the modified cart
      req.session.guest_cart = guest_cart;

      // Redirect the user to the cart page after updating the cart
      res.redirect('/cart');
  }
  } catch (error) {
    console.error(error);

    res.status(500).send(error + "Greška!");
  }
};


exports.removeFromCart = async (req, res) => {
  try {
      const product_id = req.params.product_id;
      const size = req.params.size;

      let cart, products;

      if (req.session.user_cart)
         cart = req.session.user_cart;

      else if (req.session.guest_cart)
         cart = req.session.guest_cart;
        
      else 
        return res.json({ error: "Greška, proizvod nedostupan!" });
      

      // Check if the product ID is provided
      if (!product_id) 
          return res.json({ error: "Greška, proizvod nedostupan!" });
      

      // Remove the item from the cart based on the product ID and size (if provided)
      if (size === 'undefined') 
          cart = cart.filter(item => String(item.product_id) !== String(product_id));
       else 
          cart = cart.filter(item => !(String(item.product_id) === String(product_id) 
                                                  && item.size === size.replace(/"/g, '')));
      
      products = await Promise.all(cart.map(async item => {
          const product = await Product.findById(item.product_id).exec();
          return product;
      }));

      if (req.session.user_cart) req.session.user_cart = cart;
      else req.session.guest_cart = cart;


      const cart_items_count = 
      req.session.guest_cart !== undefined ? req.session.guest_cart.length : 
      (req.session.user_cart !== undefined ? req.session.user_cart.length : 0);
 

      res.locals.cart_items_count = cart_items_count;

      return res.json({
          cart_items: cart || [],
          user_products: products || [],
          guest_products: products || [],
          cart_items_count: cart_items_count,
          message: 'Uspjesno'
      });
  } catch (error) {
      console.error(error);
      res.status(500).send(error + "Greška!");
  }
};


exports.renderDelivery = async (req, res) => {

  try {
    const user = req.user;

    const login_url = `/login?redirect=${encodeURIComponent(req.originalUrl)}`;

    if (user){
       const cart_items = req.session.user_cart;
  
      if (!cart_items || cart_items.length <= 0) return res.redirect('/cart');
    }
    
    res.render('delivery.ejs', {currentPath: '/delivery', title: 'Lato \u2022 Narudzba', user, login_url });
   
  } catch (error) {
    console.error(error);

    res.status(500).send(error + "Greška!");
  }
};

exports.renderGuestDelivery = async (req, res) => {
  try {
    const user = req.user;
    const cart_items = req.session.guest_cart;

    if (!cart_items || cart_items.length <= 0) return res.redirect('/cart');

    res.render('guest_delivery.ejs', { currentPath: '/delivery', title: 'Lato \u2022 Gost narudzba', user });
   
  } catch (error) {
    console.error(error);


    res.status(500).send(error + "Greška!");
  }
};


async function checkIfUserExists(email) {
  try {
    // Find a user with the provided email address
    const existingUser = await User.findOne({ email });
    
    // If a user with the provided email exists, return true
    // Otherwise, return false
    return !!existingUser;
  } catch (error) {
    
    console.error('Error checking if user exists:', error);
    throw error; 
  }
}



exports.processUserDelivery = async (req, res) => {
  try{

    // Check if user is logged in
    if (req.user){
      const user = req.user;
      const { city, zip_code, street, payment_method } = req.body;

      // Get user cart items from database
      let total_price = 0;

      const cart_items = req.session.user_cart;
      const user_cart_items = []

      if (cart_items && cart_items.length > 0) {
        for (const item of cart_items) {
          const product = await Product.findById(item.product_id).exec();
          if (product) {
            if (product.discount.active ){
              total_price += item.quantity * (product.price - (product.price * product.discount.percentage / 100 ));
            }
            else total_price += item.quantity * product.price;
  
            user_cart_items.push({
              product: {
                id: product._id,
                name: product.name,
                price: product.price,
                discount:{
                  active: product.discount.active,
                  percentage: product.discount.percentage
                },
                material: product.material,
                category: product.category
              },
              quantity: item.quantity,
              sizes: item.sizes,
              total_price: total_price
            });
          }
        }
      }
  
      

      const default_address = {
        region: 'Hrvatska',
        street: user.address.street,
        city: user.address.city,
        zip_code: user.address.zip_code
      };
      
      // Construct the address object based on the provided input values
      // or default values if inputs are empty
      const new_address = {
        region: default_address.region,
        street: street ? street.trim() : default_address.street,
        city: city ? city.trim() : default_address.city,
        zip_code: zip_code ?  zip_code.trim() : default_address.zip_code 
      };

      // Check if the address needs to be updated
      const address_changed = new_address.street !== user.address.street
                           || new_address.city !== user.address.city 
                           || new_address.zip_code !== user.address.zip_code;

      const user_data = {
        first_name: user.first_name,
        last_name: user.first_name,
        phone: user.phone,
        email: user.email
      }


      const order = new Order({
        user: user_data, 
        order_date: new Date(),
        total_amount: total_price,
        status: 'U tijeku',
        cart_items: user_cart_items, 
        address:  address_changed ? new_address : default_address,
        payment_method: payment_method
         
      });
    
      // Save the order to the database
      await order.save();



      
    for (const item of order.cart_items) {
      const product = await Product.findById(item.product.id);

      // If product exists and both quantity and stock_quantity are valid numbers
      if (product && !isNaN(item.quantity) && !isNaN(product.stock_quantity)) {
          // Update stock quantity
          product.stock_quantity -= item.quantity;
          
          await product.save();
      }
  }
  
      req.session.user_cart = [];
      res.redirect('/delivery?success');
    }

  }catch (error) {
    console.error(error);
    res.status(500).send(error + "Greška!");
  }
}


exports.proccesGuestDelivery = async (req, res) => {
  try {
    const cart_items = req.session.guest_cart;

    const guest_cart_items = []


    const { first_name, last_name,
      city, zip_code, street,
      email, phone, payment_method } = req.body;


    // Check if a user with the provided email already exists
    const userExists = await checkIfUserExists(email);

    if (userExists) {
      return res.status(400).send('A user with this email already exists.');
    } 
  
    // Create a new user record
    const guest_user = new User({
      first_name: first_name,
      last_name: last_name,
      address: {
        region: 'Hrvatska',
        street: street,
        city: city,
        zip_code: zip_code
      },
      email: email,
      phone: phone,
      role: 'guest'
    });
  
    // Save the user record to the database

    await guest_user.save();


  
    let total_price = 0;
  
    if (cart_items && cart_items.length > 0) {
      for (const item of cart_items) {
        const product = await Product.findById(item.product_id).exec();
        if (product) {
          if (product.discount.active ){
            total_price += item.quantity * (product.price - (product.price * product.discount.percentage / 100 ));
          }
          else total_price += item.quantity * product.price;

          guest_cart_items.push({
            product: {
              id: product._id,
              name: product.name,
              price: product.price,
              discount:{
                active: product.discount.active,
                percentage: product.discount.percentage
              },
              material: product.material,
              category: product.category
            },
            quantity: item.quantity,
            sizes: item.sizes,
            total_price: total_price
          });
        }
      }
    }

    const guest_data = {
      first_name: guest_user.first_name,
      last_name: guest_user.first_name,
      phone: guest_user.phone,
      email: guest_user.email
    }

    // Create the order
    const order = new Order({
      user: guest_data, 
      order_date: new Date(),
      total_amount: total_price,
      status: 'U tijeku',
      cart_items: guest_cart_items, 
      address: {
        region: 'Hrvatska', // Hardcoded for now
        street: street,
        city: city,
        zip_code: zip_code
      },
      payment_method: payment_method
    });

  
    // Save the order to the database
    await order.save();

    for (const item of order.cart_items) {
      const product = await Product.findById(item.product.id);

      // If product exists and both quantity and stock_quantity are valid numbers
      if (product && !isNaN(item.quantity) && !isNaN(product.stock_quantity)) {
          // Update stock quantity
          product.stock_quantity -= item.quantity;
          await product.save();
      }
  }


    req.session.guest_cart = [];

    res.redirect('/cart?success');



  } catch (error) {
    res.status(500).send(error + "Greška!");
  }
};



exports.cancelOrder = async (req, res) =>{
  try {
    const order_id = req.params.order_id;
    const user = req.user;

    // Check for valid order id
    if (!order_id) 
      return res.status(400).json({error: 'Narudžba nije pronađena!'});

    const order = await Order.findById(order_id);
    // Check if order exists
    if (!order) 
      return res.status(404).json({  error: 'Narudžba nije pronađena!' });

    // Check if order status is aviable for changing
    if (order.status !== 'U tijeku')
      return res.json({message: "Narudžbu nije moguće poništiti!"})

      for (const item of order.cart_items) {
        const product = await Product.findById(item.product.id);
  
        // If product exists and both quantity and stock_quantity are valid numbers
        if (product && !isNaN(item.quantity) && !isNaN(product.stock_quantity)) {
            // Update stock quantity
            product.stock_quantity += item.quantity;
            
            await product.save();
        }
    }


    order.status = 'Otkazano';
    
    // await order.deleteOne();

    await order.save();
    
    return res.json({
      message: 'Narudžba je uspješno poništena!'});

  } catch (error) {
    // Log the error
    console.error(error);
    return res.status(500).send('Greška!');
  }
}




/**
 * GET /contact
 * Contact
 */
exports.contact = async (req, res) => {
  const user = req.user;
  res.render('contact.ejs', { title: 'Lato \u2022 Kontakt', user });
}

/**
 * GET /about
 * About
 */
exports.about = async (req, res) => {
  const user = req.user;

  res.render('about.ejs', { title: 'Lato \u2022 O nama', user });
}
