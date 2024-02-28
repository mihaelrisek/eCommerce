// app.js


const express = require('express');
const expressLayouts = require('express-ejs-layouts')
const fileUpload = require('express-fileupload');
const session = require('express-session');
const flash = require('express-flash');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');

const SECRET_KEY = 'somethjing';

require('dotenv').config();

app.use(flash());
app.use(fileUpload());
app.use(express.urlencoded( { extended : true } ) );
app.use(express.static('public'));
app.use(express.json());
app.use(expressLayouts);



// Middleware to set global variables
app.use((req, res, next) => {
  // Set the current path as a global variable
  app.locals.currentPath = req.path;
  next();
});



const passport = require('passport');
require('./server/config/passport')(passport);

app.use(session({
  secret: SECRET_KEY,
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 5 * 24 * 60 * 60 * 1000 }, // 5 days in milliseconds
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(express.json());

app.set('layout', './layouts/main');
app.set('view engine', 'ejs');
// app.set('views', './server/views') 

const shopRoutes = require('./server/routes/shopRoutes.js')
const adminRoutes = require('./server/routes/adminRoutes.js')
const authRoutes = require('./server/routes/authRoutes.js')
app.use('/', shopRoutes);
app.use('/', authRoutes);
app.use('/', adminRoutes);



// app.use( function(req, res, next){
//   const user =  req.user;
//   res.status(404).render('404', {user});
// });



// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log('MongoDB connected');
    
    // Start server only after MongoDB connection is established
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });