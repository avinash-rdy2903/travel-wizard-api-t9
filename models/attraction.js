const mongoose = require('mongoose');
const Attraction = new mongoose.Schema({
    address : {
        type : String,
        required : true,
    },
    lat:Number,
    long:Number,
    description:String,
    image:String
})
module.exports = mongoose.model('Attraction',Attraction)