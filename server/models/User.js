const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String,  unique: true },
  password:  String,
  first_name: String,
  last_name: String,
  address:{
    region: String, 
    street: String, 
    city: String, 
    zip_code: String
  },
  phone: String,
  role: { type: String,
          enum: ['admin', 'regular_user', 'guest'],
          default: 'regular_user' },
  resetPasswordToken: String,  
  resetPasswordExpires: Date,  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

userSchema.methods.validPassword = 
    async function (password) {
      try {
        return await bcrypt.compare(password, this.password);
      } catch (error) {
        throw new Error(error);
      }
};

module.exports = mongoose.model('User', userSchema);
