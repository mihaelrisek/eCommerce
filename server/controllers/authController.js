const User =       require('../models/User');  // User.js


const passport =   require('passport');
const crypto =     require('crypto');
const bcrypt = require('bcrypt');

const nodemailer = require('nodemailer');


/**
 * GET /register
 * Create new user (register)
 * Page where user gives its data for an accound
 */


exports.register = (req, res) => {
  const user = req.user;
  res.render('register.ejs', { title: 'Register', user });
};


/**
 * 
 */
exports.registerUser = async (req, res) => {
  try {

    // GET user data from register form 
    // and add it to specific variable
    const { username,
      email,
      password,
      first_name,
      last_name,
      address,
      phone } = req.body;



    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with hashed password
    // and other data
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      address,
      phone
    });

    await newUser.save();   // Save/add the new user to the database

    // Finally redirect to login page
    // where user validate its email and password
    res.redirect('/login');

  } catch (error) {
    res.status(500).send({ message: error.message || 'Error occurred during registration' });
  }
};


/**
 * GET /login
 * Login
 */
exports.login = (req, res) => {
  try {

    const user = req.user;
    res.render('login.ejs', { title: 'Login', user });

  } catch (error) {
    console.error(error);
    res.status(500).send(error + "\tServer Error");
  }

};


// Handle login form submission
exports.loginUser = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
});

// Logout route

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send({ message: err.message || 'Error occurred during logout' });
    }
    res.redirect('/');
  });
};

exports.forgotPassGET = async (req, res) =>{
  try {
    
    let user = req.user;
    res.render('forgot-password.ejs', {user});

  } catch (error) {
    console.error(error);
    res.status(500).send(error + "\tServer Error");
  }
}


exports.forgotPassPOST = async (req, res) =>{
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('forgot-password.ejs', { error: 'User not found' });
    }

    // Generate and save a reset token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in one hour
    await user.save();
    console.log("here")
    // Send the reset link to the user's email
    sendPasswordResetEmail(user.email, token);

    res.render('forgot-password.ejs', { message: 'Password reset email sent', user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}


exports.resetPassGET = async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render('reset.ejs', { error: 'Invalid or expired token', user });
    }

    // Render the reset password form
    res.render('reset.ejs', { token , user});
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

exports.resetPassPOST = async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render('reset.ejs', { error: 'Invalid or expired token' });
    }

    // Extract the new password and confirm password from the form submission
    const newPassword = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      return res.render('reset.ejs', { error: 'Passwords do not match' });
    }

    // Update the user's password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the updated user to the database
    await user.save();

    // Redirect to the login page or any other desired page
    res.redirect('/login');
  } catch (error) { 
    console.error(error);
    res.status(500).send('Server Error');
  }
}


async function sendPasswordResetEmail(email, token) {
  try {
    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'latosuppport@gmail.com',
        pass: 'xgzy hinw cuac fljo',
      },
    });

    // Email options
    const mailOptions = {
      from: 'latosuppport@gmail.com',
      to: email,
      subject: 'Password Reset - Lato',
      text: `Click the link to reset your password: http://localhost:3000/reset/${token}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log('Password reset email sent successfully');

  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

