require('dotenv').config();

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/userDetails'),
    PlaceCart = require('../models/placeCart'),
    HotelCart = require('../models/hotelCart'),
    FlightCart = require('../models/flightCart'),
    flightsData = require('../models/flight'),
    PrimaryItinerary = require('../models/primaryItinerary'),
    ItineraryComments = require('../models/itineraryComments');

const { middleware, helper } = require('../utils/utils'),
    transporter = require('../utils/mailTransporter');

router.post("/hotels", middleware.isLoggedIn, async (req, res) => {
    const userId = req.session.passport.user._id;
    try {
        var { hotelCart } = await helper.getUserCart(undefined, HotelCart, undefined, userId);
        console.log("HotelCart", hotelCart)
        let primaryItinerary = await helper.getPrimaryItinerary(PrimaryItinerary, userId);
        if (hotelCart == null) {
            hotelCart = await HotelCart.create({ user: userId, hotels: [{ hotel: req.body.hotelId, room: req.body.roomId, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate) , bookedStatus: true }] });
            primaryItinerary.hotelCart = hotelCart._id;
            await primaryItinerary.save();
        } else {
            hotelCart.hotels.push({ hotel: req.body.hotelId, room: req.body.roomId, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate), bookedStatus: true });
        }
        await hotelCart.save();
        // hotelCart = await hotelCart.populate('hotels.hotel', "-image -rooms -reviews").populate("hotels.room", '-hotelId -roomReservations').execPopulate();;
        res.json({ status: 200, hotelCart: hotelCart });
    } catch (e) {
        console.log(e.stack);
        res.json({ status: 400, message: e.message });
    }
})



router.post("/flights", middleware.isLoggedIn, async (req, res) => {
    const userId = req.session.passport.user._id;
    try {
        var { flightCart } = await helper.getUserCart(undefined, undefined, FlightCart, userId);
        let primaryItinerary = await helper.getPrimaryItinerary(PrimaryItinerary, userId);
        if (flightCart == null) {
            flightCart = await FlightCart.create({ user: userId, flights: [{ flight: req.body.flightId, date: new Date(req.body.date), bookedStatus: true }] });
            primaryItinerary.flightCart = flightCart._id;
            await primaryItinerary.save();
        } else {
            flightCart.flights.push({ flight: req.body.flightId, seats: req.body.seatNumber, date: new Date(req.body.date), bookedStatus: true });
        }
        await flightCart.save();
        flightCart = await flightCart.populate("flights.flight");
        console.log("req body", req.body);
        if (req.body.bookedStatus == true) {
            flightdetails = await flightsData.findById(req.body.flightId);
            let seatNumber = flightdetails.seats - 1;
            flightdetails.seats = seatNumber;
            await flightdetails.save();
            const mailOptions = {
                from: process.env.ADMIN_EMAIL,
                to: req.body.email,
                subject: 'Flight Booking Confirmed',
                html: `<h3>Hello ${req.user.username}</h3> <div> Your flight booking has been confirmed.</div><div>Thank you for joining Travel Wizard</div>`
            };
            await transporter.sendMail(mailOptions);
        }
        res.json({ status: 200, flightCart: flightCart });
    } catch (e) {
        console.log(e.stack);
        res.json({ status: 400, message: e.message });
    }
})

router.delete("/cancelflights/:cancelflightId", middleware.isLoggedIn, async (req, res) => {
    const userId = req.session.passport.user._id;
    try {
        var cancelflight = await FlightCart.findOne({ user: req.session.passport.user._id });
        if (userId == cancelflight.user) {
            var deletedFlight = cancelflight.flights.find(flight => flight._id.toString() === req.params.cancelflightId.toString());
            cancelflight.flights = cancelflight.flights.filter(flight => flight._id.toString() !== req.params.cancelflightId.toString());
            await cancelflight.save();
        }
        flightdetails = await flightsData.findById(deletedFlight.flight);
        if (flightdetails) {
            let seatNumber = flightdetails.seats + 1;
            flightdetails.seats = seatNumber;
            await flightdetails.save();
            const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: req.body.email,
            subject: 'Flight Booking Confirmed',
            html: `<h3>Hello ${req.user.username}</h3> <div> Your flight booking has been confirmed.</div><div>Thank you for joining Travel Wizard</div>`
        };
        await transporter.sendMail(mailOptions);
        } else {
            console.log("Flight details not found");
        }
        res.json({ status: 200, message: "Booking Cancelled" });
    } catch (e) {
        console.log(e.stack);
        res.json({ status: 400, message: e.message });
    }
})

module.exports = router;