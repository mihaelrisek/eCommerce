const mongoose = require('mongoose');

const imagesSchema = new mongoose.Schema({
  // images_url: { type: [String], default: []},
  material: String,
  description: String,

});
module.exports = mongoose.model('Images', imagesSchema);
