const mongoose = require('mongoose');
const Place = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true,
        index:true
    },
    attractions :[
        {
            type : mongoose.Schema.Types.ObjectId,
            ref:"Attraction"
        }
    ],
    hotels:[
        {
            type : mongoose.Schema.Types.ObjectId,
            ref:'hotel'
        }
    ]
})
module.exports = mongoose.model("place",Place)