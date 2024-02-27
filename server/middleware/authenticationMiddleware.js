
module.exports = (req, res, next) => {
  if (req.session && req.session.user)  return next();
  else res.redirect('/login'); // Redirect to login page if not authenticated
};
