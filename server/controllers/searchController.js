
exports.searchProducts = async (req, res) =>{
  try {
    const Product = require('../models/Product'); 
    const searchTerm = req.query.search; 
    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } }, 
        { description: { $regex: searchTerm, $options: 'i' } } ,
        { material: { $regex: searchTerm, $options: 'i' } } ,
        { category: { $regex: searchTerm, $options: 'i' } } 
      ]
    })

    return res.status(200).json(products);
  } catch (error) {
    res.status(500).json( error, { error: 'Internal Server Error' });
  }
}