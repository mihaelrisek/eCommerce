const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { first_name: String, last_name: String,
          phone: String, email: String,
  },
  order_date: { type: Date, default: Date.now },
  total_amount: { type: Number, required: true },
  status: { type: String,
            enum: ['U tijeku','Na putu', 'Dostavljeno', 'Otkazano'],
            default: 'U tijeku' },
  cart_items: [{
    product: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String, price: Number,
      discount:{ active: Boolean, percentage: Number
      },
      material: String, category: String
    },
    quantity: Number, sizes: String,
    total_price: Number
  }], 
  address:{ region: String, street: String,
            city: String,   zip_code: String 
  },
  payment_method: { type: String,
                    enum: ['credit_card', 'cod'],
                    required: true },
});

module.exports = mongoose.model('Order', orderSchema);
  
