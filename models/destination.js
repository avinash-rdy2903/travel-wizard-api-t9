const mongoose = require('mongoose');
const Destination = new mongoose.Schema({
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
    ]
})