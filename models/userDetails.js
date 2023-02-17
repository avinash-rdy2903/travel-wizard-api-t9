const mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
	email:{
        type: String,
        unique: true,
        required: true
    },
    phone:{
        type: String,
        unique: true,
        partialFilterExpression: {houseName: {$type: "string"}}
    },
    fn:{type:String, required:true},
    ln:String,
    credId:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'Credentials'
	}
});
module.exports=mongoose.model("User",userSchema);