const mongoose = require('mongoose');
const Reservation = new mongoose.Schema({
    guestId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        unique:true,
        index:true
    },
    roomReservationId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"RoomReservation"
    }],
    totalPrice:Number,
    startDate:Date,
    endDate:Date
})
module.exports = mongoose.model('Reservation',Reservation);