const mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
	email:{
        type: String,
        unique: true,
        required: true
    },
    phone:{
        type: String,
        sparse:true
    },
    fn:{type:String, required:true},
    ln:String,
    verified:{type:Boolean, required:true},
    credId:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'Credentials'
	},
    otpID:{type:mongoose.Schema.Types.ObjectId, ref:'otp'}
});
module.exports=mongoose.model("User",userSchema);