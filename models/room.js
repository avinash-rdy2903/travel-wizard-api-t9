const mongoose = require('mongoose');
const Room = new mongoose.Schema({
    roomNumber:String,
    price:Number,
    hotelId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'roomtype'
    },
    roomtypeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'roomtype'
    }
})

module.exports=mongoose.model("Room",Room);