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

 // Check if the passwords meet the complexity requirements
function checkPassword(password)  {
  // At least one lowercase letter, one uppercase letter
  // At least one digit, one special character
  // Minimum length of 6 characters
  const password_regex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\\\|\[\]{};:'",.<>?]).{6,}$/;
  return password_regex.test(password);
};

// Exported functions to make them available in scope
module.exports = { capitalizeFirstLetter, validateEmail, checkPassword };