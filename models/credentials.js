const mongoose = require("mongoose"),
	passportLocalMongoose = require("passport-local-mongoose");

const credentials = new mongoose.Schema({
	username:{
		type: String,
        unique: true,
        required: true
	},
	password: String,
});

credentials.plugin(passportLocalMongoose);

module.exports=mongoose.model("Credentials",credentials);