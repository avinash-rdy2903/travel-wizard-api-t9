require('dotenv').config();

const express = require('express'),
    mongoose = require('mongoose'),
    authPassport = require("../auth/authPassport"),
    transporter = require("../utils/mailTransporter"),
    jwt = require('jsonwebtoken');

const router = express.Router();

const User = require('../models/userDetails'),
    Credentials = require('../models/credentials'),
    Otp = require('../models/otp'),
    PrimaryItinerary = require('../models/primaryItinerary'),
    PlaceCart = require('../models/placeCart'),
    HotelCart = require('../models/hotelCart'),
    FlightCart = require('../models/flightCart');
const { middleware , helper }= require('../utils/utils');

router.post('/local',authPassport.authenticate('local',{
    failureRedirect:'/auth/login/failure',
}),async (req,res)=>{
    // console.log(suc)
    // let {placeCart,hotelCart,flightCart} = await helper.getUserCart(PlaceCart,HotelCart,FlightCart,req.user._id);
    var primaryItinerary = await helper.getPrimaryItinerary(PrimaryItinerary,req.user._id);
    let user = req.user;
    if(req.user.provider==='google'){
        user = req.user._json;
    }else{
        user = await User.findOne({credId:req.user._id},"-otpId");
    }
    // await primaryItinerary;
    primaryItinerary = await helper.populatePrimaryItinerary(primaryItinerary);
    res.status(200).json({status:200,user:user,placeCart:primaryItinerary.placeCart || {},hotelCart:primaryItinerary.hotelCart || {},flightCart:primaryItinerary.flightCart || {},comments:primaryItinerary.comments});

})
router.get('/login/:action',async (req,res)=>{
    if(req.params.action==='failure'){
        console.log(req.body);
        console.log("failed login");
        res.status(400).json({status:401,redirect:'/login',message:"Auth failed"})
    }else{
        // let {placeCart,hotelCart,flightCart} = await helper.getUserCart(PlaceCart,HotelCart,FlightCart,req.user._id);
        const primaryItinerary = helper.getPrimaryItinerary(PrimaryItinerary,req.user._id);
        let user = req.user;
        if(req.user.provider==='google'){
            user = req.user._json;
        }else{
            user = await User.findOne({credId:req.user._id},"-otpId");
        }
        primaryItinerary = await helper.populatePrimaryItinerary(primaryItinerary);
        // res.status(200).json({status:200,user:user,placeCart:primaryItinerary.placeCart,hotelCart:primaryItinerary.hotelCart,flightCart:primaryItinerary.flightCart,comments:primaryItinerary.comments});
        res.status(200).json({status:200,user:user,placeCart:primaryItinerary.placeCart || {},hotelCart:primaryItinerary.hotelCart || {},flightCart:primaryItinerary.flightCart || {},comments:primaryItinerary.comments});

    }
})
router.get('/google',authPassport.authenticate('google', {
    scope:
        ['email', 'profile']
}));
router.get('/google/callback',
    authPassport.authenticate('google', {
        failureRedirect: '/auth/login/failure',
        successRedirect: '/auth/login/success'
    })
);
router.get('/verify/email/:id/:token',async (req,res)=>{
    try{
        let user = await User.findById(mongoose.Types.ObjectId(req.params.id));
        if(user==null){
            res.status(400).json({status:400,message:'invalid link'});
        }
        jwt.verify(req.params.token, process.env.JWT_SECRET_TOKEN,async (err, tokenUser) => {
            console.log(user.id);
            console.log(tokenUser.id);

            if(err){
                res.status(400).json({status: 400, message: err.message});
            }
            else if(tokenUser.id!==user.id){
                res.status(400).json({status: 400, message: "Invalid token for user"});
            }
            else{
                user.verified= true;
                await user.save();
                res.json({status: 200, message:"Email Verified"});
            }
        })
    }catch(err){
        res.status(400).json({status: 400, message: err.message});
    }
})
router.post('/otp/verify',async (req,res)=>{
    try{
        const otp = await Otp.findOne({otp:req.body.otp});
        if(otp==null){
            res.json({status:400,message:"Invalid Otp"});
        }
        const user = await User.findOne({email:otp.email});
        const update = {password:req.body.password};
        const cred = await Credentials.findByIdAndUpdate(user.credId,update);
        await cred.save();
        await Otp.remove({_id:otp.id});
        // let username = cred.username;
        // await Credentials.remove({_id:cred.id});
        // const newCred = await Credentials.create({username:username,password:req.body.password});
        // user.credId = newCred.id;
        // await user.save();
        res.json({status:200,redirect:'/',message:'Password reset complete'});
    }catch(err){
        console.log(err.stack);
        res.status(400).json({status:400,message:err.message});
    }
})
router.post('/otp/generate',async (req,res)=>{
    try{
        const user = await User.findOne({ email: req.body.email});
        if(user==null){
            res.json({status:401,message:"Invalid email/User not found"});
        }
        const otpGen = Math.floor(1000 + Math.random() * 9000);
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: user.email,
            subject: 'Travel Wizard OTP',
            html: `<h3>Hello ${user.ln}</h3><div> Please use the OTP:${otpGen} to reset password.</div><div>Thank you for using our services.</div>`
        };
        let info = await transporter.sendMail(mailOptions);
        let otp = await Otp.findOne({ email:req.body.email});
        if(otp==null){
            otp = await Otp.create({ email:req.body.email});
        }
        otp.otp = otpGen;
        user.otpId = otp.id;
        await user.save();
        await otp.save();
        res.json({status:200,message:"Otp has been delivered"});
    }catch(err){ 
        res.status(400).json({status:400,message:err.message});
    }
})

module.exports = router;