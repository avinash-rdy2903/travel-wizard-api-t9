const mongoose = require('mongoose');
const Place = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true
    },
    attractionIds :[
        {
            type : mongoose.Schema.Types.ObjectId,
            ref:"attraction"
        }
    ],
    hotelId:[
        {
            type : mongoose.Schema.Types.ObjectId,
            ref:'hotel'
        }
    ]
})
module.exports = mongoose.model("place",Place)