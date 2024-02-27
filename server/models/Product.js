const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock_quantity: { type: Number, default: 0 },
  images: { type: [String], default: []},
  product_type: String,
  subcategory: String,
  details: mongoose.Schema.Types.Mixed, // Mixed type for dynamic details
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);



