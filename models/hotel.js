const mongoose = require('mongoose');
const Hotel = new mongoose.Schema({
    name: String,
    address: String,
    lat:Number,
    long:Number,
    roomId:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:'room'
    }],// refers to another room associated with the hotel
})
module.exports=mongoose.model("Hotel",Hotel);