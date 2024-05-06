const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock_quantity: { type: Number, default: 0 },
  images: { type: [String], default: []},
  material: String,
  category: String,
  details: mongoose.Schema.Types.Mixed,
  sizes: { type: [String], default: []},
  discount: { 
    active: { type: Boolean, default: false },
    percentage: { type: Number,  min: 0, max: 100 },
    start_date: { type: Date},
    end_date: { type: Date},
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

productSchema.pre('save', function(next) {
  if (this.discount && this.discount.start_date && this.discount.end_date) {
    const current_date = new Date();
    if (current_date < this.discount.start_date || current_date > this.discount.end_date) {
      this.discount.active = false;
    }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);



