// adminMiddleware.js

module.exports = (req, res, next) => {
  const user = req.user;

  // Check if the user is an admin
  if (user && user.role === 'admin') {
    next(); // User is an admin, proceed to the next middleware or route handler
  } else {
    res.redirect('/');
    // res.status(403).send('Access Denied'); // User is not an admin, send forbidden status
  }
};
