const mongoose = require('mongoose');
const FlightCartSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    flights:[{
        flight:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Flight"
        },
        date:Date
    }]
})
module.exports = mongoose.model('FlightCart',FlightCartSchema);
