const mongoose = require('mongoose');
const roomReservation = new mongoose.Schema({
    roomId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"room"
    },
    ReservationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"reservation"
    }
})
module.exports = mongoose.model('roomReservation', roomReservation)