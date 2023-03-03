const mongoose = require('mongoose')
const Flight = new mongoose.Schema({
    source:String,
    destination:String,
    departureDate:Date,
    arrivalDate:Date,
    price:Number,
    seats:Number,
    
})