const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: {
    name: String,
    zip_code: String
  },
  city: {
    name: String,
    zip_code: String
  },
  country: String
});

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_date: { type: Date, default: Date.now },
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
  cart_items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }], 
  address: addressSchema,
  payment: {
    method: { type: String, enum: ['credit_card', 'paypal'], required: true },
    transaction_id: { type: String, unique: true },
    currency: { type: String, enum: ['USD', 'EUR', 'GBP'] }, 
    payment_status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending'
    }
  }
});

module.exports = mongoose.model('Order', orderSchema);
