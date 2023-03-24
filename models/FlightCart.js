const mongoose = require('mongoose');
const FlightCartSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    flights:[{
        flightId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Flight"
        },
        seats:Number,
        date:Date
    }]
})
module.exports = mongoose.model('FlightCart',FlightCartSchema);