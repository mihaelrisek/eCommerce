const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: String,
  last_name: String,
  address: String,
  phone: String,
  role: { type: String, enum: ['admin', 'regular_user'], default: 'regular_user' },
  cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
  resetPasswordToken: String,  
  resetPasswordExpires: Date,  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

userSchema.methods.validPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = mongoose.model('User', userSchema);
