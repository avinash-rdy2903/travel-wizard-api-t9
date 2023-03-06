const mongoose = require('mongoose');
const Review = new mongoose.Schema({
    ratings:Number,
    comment:String
})
module.exports = mongoose.model('Review',Review)