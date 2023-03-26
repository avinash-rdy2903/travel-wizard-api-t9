require('dotenv').config();

const express = require('express');
const router = express.Router();

const PlaceCart = require('../models/placeCart'),
    HotelCart = require('../models/hotelCart'),
    FlightCart = require('../models/flightCart');

const { middleware , helper }= require('../utils/utils');

router.post("/places",middleware.isLoggedIn,async (req,res)=>{
    const userId = req.session.passport.user._id;
    try{
        var {placeCart} = await helper.getUserCart(PlaceCart,undefined,undefined,userId);
         if(placeCart==null){
            placeCart = await PlaceCart.create({user:userId,places:[{id:req.body.placeId,visitingDate:new Date(req.body.visitingDate)}]});
        }else{
            placeCart.places.push({id:req.body.placeId,visitingDate:new Date(req.body.visitingDate)});
        }
        await placeCart.save();
        res.json({status:200,message:"Added to cart"});
    }catch(e){
        console.log(e.stack);
        res.json({status:400,message:e.message});
    }
})
router.post("/hotels", middleware.isLoggedIn, async (req, res) => {
    const userId = req.session.passport.user._id;
    try {
        var { hotelCart } = await helper.getUserCart(undefined, HotelCart, undefined, userId);
        if (hotelCart == null) {
            hotelCart = await HotelCart.create({ user: userId, hotels: [{ hotel: req.body.hotelId, room: req.body.roomId, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate)}] });
        } else {
            hotelCart.hotels.push({ hotel: req.body.hotelId, room: req.body.roomId, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate) });
        }
        await hotelCart.save();
        res.json({ status: 200, message: "Added to cart" });
    } catch (e) {
        console.log(e.stack);
        res.json({ status: 400, message: e.message });
    }
})

router.post("/flights", middleware.isLoggedIn, async (req, res) => {
    const userId = req.session.passport.user._id;
    try {
        var { flightCart } = await helper.getUserCart(undefined, undefined, FlightCart, userId);
        if (flightCart == null) {
            flightCart = await FlightCart.create({ user: userId, flights: [{ flight: req.body.flightId, seats:req.body.seatNumber, date: new Date(req.body.date) }] });
        } else {
            flightCart.flights.push({ flight: req.body.flightId, seats: req.body.seatNumber, date: new Date(req.body.date)});
        }
        await flightCart.save();
        res.json({ status: 200, message: "Added to cart" });
    } catch (e) {
        console.log(e.stack);
        res.json({ status: 400, message: e.message });
    }
})

module.exports = router;