const User =       require('../models/User');  
const passport =   require('passport');
const crypto =     require('crypto');
const bcrypt =     require('bcrypt');
const nodemailer = require('nodemailer');

const {validateEmail, checkPassword } = require('../functions/func');







/**
 * GET /register
 * Page where user gives its data for an account
 */
exports.renderRegister = (req, res) => {
  try {
    // Ensure the user is authenticated before rendering the register page
    if (!req.isAuthenticated()) {
      // Redirect to the login page if the user is not authenticated
      return res.redirect('/login');
    }

    // Pass only necessary user data to the template to enhance security
    const { email, username } = req.user; 

    res.render('register.ejs', { title: 'Register', email, username });

  } catch (error) {
    console.error('Greška prilikom prikazivanja sadržaja:', error);
    // Send a generic error message to the client
    res.status(500).send('Greška prilikom prikazivanja sadržaja');
  }
};



exports.registerUser = async (req, res) => {
  try {

    // GET user data from register form 
    // and add it to specific variable
    const { email, password,
            first_name, last_name,
            phone, street,
            city, zip_code} = req.body;

    // Perform validation checks
    if (!email  || !password ||
        !first_name || !last_name || 
        !street || !city || !zip_code) 
      return res.status(400).json({ error: 'Svi podatci su obavezni.' });
    

    if (!checkPassword(password)) {
      return res.status(400).json({
        error: `Lozinka mora sadržavati barem jedno veliko slovo,
                jedno malo slovo, jedan poseban znak i biti dugačka barem 6 znakova.`
      });
    }

    if(!validateEmail(email)) 
      return res.status(400).json({ error: 'Neispravan format e-maila.' });
    
    // Hash the password
    const hashed_password = await bcrypt.hash(password, 10);

    // Create new user with hashed password
    // and other data
    const newUser = new User({
      email,
      password: hashed_password,
      first_name,
      last_name,
      phone,
      address: {
        region: 'Hrvatska', 
        street: street, 
        city: city, 
        zip_code: zip_code 
      }
    });

    // Saved new user to the database
    await newUser.save();   

    // Redirect to the login page
    return res.json({ success: true, redirectUrl: '/login' });

  } catch (error) {
    res.status(500).send(
    { message: error.message || 'Greška prilikom registracije.' });
  }
};


/**
 * GET /login
 * Login
 */
exports.login = (req, res) => {
  try {
    const redirectUrl = req.query.redirect || '/'; 
    
    const user = req.user;
    res.render('login.ejs', { title: 'Login', user , redirectUrl});

  } catch (error) {
    console.error(error);
    res.status(500).send(
      { message: error.message || 'Greška prilikom prikazivanja sadržaja.' });
  }
};


exports.loginUser = (req, res, next) => {

  let redirectUrl = req.query.redirect || '/';

  if (req.body.redirect) {
    redirectUrl = req.body.redirect;
  }
  

  let stored_guest_cart = req.session.guest_cart;
  
  passport.authenticate('local', (err, user, info) => {
    if (err) { 
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.session.guest_cart = stored_guest_cart;
   
      if (req.session.guest_cart && req.session.guest_cart.length > 0) {
          req.session.user_cart = req.session.guest_cart;
          delete req.session.guest_cart;
      }

      // Redirect to the stored last URL or to the root page
      return res.redirect(redirectUrl);
    });
  })(req, res, next);
};



// Logout route
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send(
        { message: err.message || 'Greška prilikom odjavljivanja!' });
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
    res.status(500).send(error + "Greška!");
  }
}


exports.forgotPassPOST = async (req, res) =>{
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });


    if (!user) {
      return res.status(400).json({ error: 'Korisnik nije pronađen'});
    }

    // Generate and save a reset token
    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in one hour

    await user.save();
    // Send the reset link to the user's email
    sendPasswordResetEmail(user.email, token);

    return res.status(200).json({message: 'Da biste ponovno postavili lozinku provjerite poštanski pretinac.'})

  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
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
      return res.render('reset.ejs',
      { error: 'Vaš token nije valjan ili je istekao.', user });
    }

    // Render the reset password form
    res.render('reset.ejs', {  currentPath: '/reset', token , user});
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška!');
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
      return res.status(400).json(
     { error: 'Vaš token nije valjan ili je istekao.'});
    }
    // Extract the new password and confirm password from the form submission
    const newPassword = req.body.password.trim();
    const confirmPassword = req.body.confirmPassword.trim();

    // Check if the passwords are empty or consist only of spaces
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Lozinke ne mogu biti prazne.' });
    }

    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Lozinke se ne podudaraju.' });
    }

    // Check if the passwords meet the complexity requirements
    if (!checkPassword(password)) {
      return res.status(400).json({
        error: `Lozinka mora sadržavati barem jedno veliko slovo,
                jedno malo slovo, jedan poseban znak i biti dugačka barem 6 znakova.`
      });
    }

    // Update the user's password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the updated user to the database
    await user.save();

    // Redirect to the login page
    return res.json({ success: true, redirectUrl: '/login' });
  } catch (error) { 
    console.error(error);
    res.status(500).send('Greška!');
  }
}


async function sendPasswordResetEmail(email, token) {
  try {
    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'latosuppport@gmail.com',
        pass: process.env.EMAILPASS,
      },
    });

    // Email options
    const mailOptions = {
      from: 'latosuppport@gmail.com',
      to: email,
      subject: 'Password Reset - Lato',
      text: `Otvorite poveznicu da biste ponovno
             postavili lozinku: http://localhost:3000/reset/${token}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);


  } catch (error) {
    console.error('Greška u slanju e-maila', error);
    throw error;
  }
}

