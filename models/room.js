const mongoose = require('mongoose');
const Room = new mongoose.Schema({
    description:String,
    count:Number,
    maximumOccupancy:Number,
})