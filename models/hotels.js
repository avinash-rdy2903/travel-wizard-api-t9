const mongoose = require('mongoose');
const Hotel = new mongoose.Schema({
    name: String,
    address: String,
    image:String,
    rooms:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:'room'
    }],// refers to another room associated with the hotel
    availability:Number //total avilable rooms count 
})