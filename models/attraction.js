const mongoose = require('mongoose');
const attraction = new mongoose.Schema({
    address : {
        type : String,
        required : true,
    },
    lat:Number,
    long:Number,
    description:String,
    image:String
})