// app.js

const express = require('express');
const express_layout = require('express-ejs-layouts')
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

require('dotenv').config();
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(express_layout);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Došlo je do greške!');
});






  // Middleware to set global variables
  app.use((req, res, next) => {
    // Set the current path as a global variable
    app.locals.currentPath = req.path;
    next();
  });




const passport = require('passport');
require('./server/config/passport')(passport);

const SECRET_KEY = process.env.SECRET_KEY;

app.use(session({
  secret: SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 3600 * 1000 },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());


app.set('layout', './layouts/main');
app.set('view engine', 'ejs');


const fetchMaterials = async (req, res, next) => {
  try {
    const Product = require('./server/models/Product'); 

    // Pull materials from database
    const materials = await Product.distinct('material');
    const categories = await Product.distinct('category');

    // Attach materials to the request object
    res.locals.materials = materials;
    res.locals.categories = categories;
    // Call next to proceed to the next

     // Check if guest_cart or user_cart is defined, if not, set cart_items_count to 0
     const cart_items_count = 
     req.session.guest_cart !== undefined ? req.session.guest_cart.length : 
     (req.session.user_cart !== undefined ? req.session.user_cart.length : 0);

     res.locals.cart_items_count = cart_items_count;

    next();
  } catch (error) {
    res.status(500).send({ message: error.message || 'Greška u dohvaćanju podataka!' });
  }
};
app.use(fetchMaterials);


const shopRoutes = require('./server/routes/shopRoutes.js')
const authRoutes = require('./server/routes/authRoutes.js')

app.use('/', shopRoutes);
app.use('/', authRoutes);

app.use('/', (req, res, next) => {
  // Check if the user is authenticated and is an admin
  if (req.isAuthenticated() && req.user.role === 'admin') {
    // Load admin routes when needed
    const adminRoutes = require('./server/routes/adminRoutes.js');
    // Mount the admin routes
    app.use('/', adminRoutes);
  }
  else res.redirect('/');
  next();
});



//  app.use((req, res, next) => {
//    const user = req.user;
//    res.status(404).render('404.ejs', { user });
//  });





// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    // Start server only after MongoDB connection is established
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });