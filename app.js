require('dotenv').config();
const express = require('express'),
     mongoose = require('mongoose'),
     cors = require('cors'),
     passport = require('passport'),
     localStrategy = require('passport-local'),
     googleStrategy = require('passport-google-oauth20').Strategy,
     flash = require('flash'),
     jwt = require('jsonwebtoken'),
     nodeMailer = require('nodemailer');

const User = require('./models/userDetails'),
    Credentials = require('./models/credentials'),
    Otp = require('./models/otp'),
    RoomReservation = require('./models/roomReservation'),
    Place = require('./models/place'),
    Attraction = require('./models/attraction'),
    Hotel = require('./models/hotel'),
    Flight = require('./models/flight');
    Room = require('./models/room'),
    RoomType = require('./models/roomType'),
    Review = require('./models/review'),
    Reservation = require('./models/reservation');

const helper = require('./helper/helper');

const transporter = nodeMailer.createTransport({
    service:'Gmail',
    auth:{
        user:process.env.ADMIN_EMAIL,
        pass:process.env.EMAIL_PASS
    }
});

mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.once('open',()=>{
    console.log('Mongo DB connection established');
}).on('error',(err)=>{
    console.log(`Mongo DB connection error:\n ${err}`);
})

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(require("express-session")({
	secret:process.env.EXPRESS_SESSION_SECRET,
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(Credentials.authenticate()));
passport.use(new googleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    passReqToCallback  : true
},async (request, accessToken, refreshToken, profile, done) => {
    console.log(profile);
    const googleUser = profile._json;
    let user = await User.findOne({email: googleUser.email});
    if(user==null) {
        user = await User.create({email:googleUser.email,fn:googleUser.given_name,ln:googleUser.family_name,verified:googleUser.email_verified});
    }
    await user.save();    
    return done(null, profile);
}
));
passport.serializeUser(function(user, done) {
    return done(null, user);
  });
  
  passport.deserializeUser(function(obj, done) {
    return done(null, obj);
  });

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/', (req, res) => {
    res.send('<div><a href=/login>Login</a></div><a href=/register>register</a>');
})
app.post('/auth/local',passport.authenticate('local',{
    failureRedirect:'/login/failure'
}),(req,res)=>{
    console.log(req.user);
    res.json({status:200,username:req.user.username});
})
app.get('/login/:action',(req,res)=>{
    if(req.params.action==='failure'){
        console.log("failed login");
        res.json({status:401,redirect:'/login',message:"Auth failed"})
    }else{
        console.log(req.user);
    // let username = req.user.username;
    if(req.user.provider==='google'){
        username = req.user._json.given_name;
    }
        res.json({status:200,username:username});
    }
})
app.get('/login',(req,res)=>{
    console.log(req.body);
    res.sendFile('public/login.html',{root:__dirname});
})
app.get('/auth/google',passport.authenticate('google', {
    scope:
        ['email', 'profile']
}));
app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login/failure',
        successRedirect: '/login/success'
    })
);
app.get('/verify/email/:id/:token',async (req,res)=>{
    try{
        let user = await User.findById(mongoose.Types.ObjectId(req.params.id));
        if(user==null){
            res.json({status:400,message:'invalid link'});
        }
        jwt.verify(req.params.token, process.env.JWT_SECRET_TOKEN,async (err, tokenUser) => {
            console.log(user.id);
            console.log(tokenUser.id);

            if(err){
                res.json({status: 400, message: err.message});
            }
            else if(tokenUser.id!==user.id){
                res.json({status: 400, message: "Invalid token for user"});
            }
            else{
                user.verified= true;
                await user.save();
                res.json({status: 200, message:"Email Verified"});
            }
        })
    }catch(err){
        res.json({status: 400, message: err.message});
    }
})
app.post('/register',async (req,res)=>{
    let creds=null,user=null;
    console.log(req.body);
    try{
        let condition = await User.findOne({email:req.body.email});
        if(condition!==null){
            res.json({status:401,message:"email already exits"});
        }
        creds = await Credentials.register(new Credentials({username:req.body.username}),req.body.password);
        user = await User.create({email:req.body.email,fn:req.body.fn,ln:req.body.ln,verified:false});
        if(req.body.phone!==null){
            let temp = await User.findOne({phone:req.body.phone});
            if(temp==null){
                user.phone = req.body.phone;
            }else{
                res.json({status:400,message:'Mobile number already exits'});
            }
        }        
        user.credId = creds.id;
        let token = jwt.sign({id:user.id},process.env.JWT_SECRET_TOKEN,{expiresIn:'1d'});

        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: req.body.email,
            subject: 'Authentication Required',
            html: `<h3>Hello ${req.body.ln}</h3><div> Please click <a href="${process.env.LINK}/verify/email/${user.id}/${token}>this link</a> to verify your email ID.</div><div>Thank you for joining Travel Wizard</div>`
        };
        let info = await transporter.sendMail(mailOptions);
        await user.save();
        passport.authenticate('local')(req, res, ()=>{
            res.json({status:200,redirect:'/',message:"user created"})
        });
    }catch(err){
        console.log(err);
        User.remove({ email: req.body.email }, function(err) {
            if (err) {
                console.log(err.message);
            }
        });
        Credentials.remove({ username: req.body.username }, function(err) {
            if (err) {
                console.log(err.message);

            }
        });
        res.redirect('/register');
    }
})
app.post('/otp/verify',async (req,res)=>{
    try{
        console.log(req.body);
        const otp = await Otp.findOne({otp:req.body.otp});
        if(otp==null){
            res.json({status:400,message:"Invalid Otp"});
        }
        const user = await User.findOne({email:otp.email});
        const cred = await Credentials.findById(user.credId);
        let username = cred.username;
        await Credentials.remove({_id:cred.id});
        const newCred = await Credentials.register(new Credentials({username:username}),req.body.password);
        user.credId = newCred.id;
        await user.save();
        res.json({status:200,redirect:'/',message:'Password reset complete'});
    }catch(err){
        res.json({status:400,message:err.message});
    }
})
app.post('/otp/email',async (req,res)=>{
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
            html: `<h3>Hello ${user.ln}</h3><div> Please use the OTP:${otpGen} to reset password.</div><div>Thank you for joining Travel Wizard</div>`
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
        res.json({status:400,message:err.message});
    }
})
app.get("/logout",(req,res)=>{
    try{
        req.logout();
        res.json({status:200,message:"logout successful"});
    }catch(err){
        console.log(err.stack);
        console.log(err.message);
    }
})
app.get("/place/:placeId",async (req, res) => {
    try{
        let place = await Place.findById(req.params.placeId).populate('attractions');
        console.log("place search working");
        console.log(place);
        res.json({status:200,place:place})
    }catch(err){
        console.log(err);
        res.json({status:400,message:err.message});
    }
})
app.get('/search/:key',async (req,res)=>{
    if(req.params.key===''){
        res.send();
    }
    try{
        const place = await Place.find({
            "$or":[{name:{$regex:'^'+req.params.key,$options:"i"}}]
        },['name','_id']);
        res.send(place);
    }catch(e){
        console.log(e.stack);
        res.json({status:400,message:e.message});
    }
})
// app.get('/search', async (req, res) => {

//     try {
//         // console.log(await Place.find({}));
//         const title = req.query.title;
//         console.log(title);
//         // const agg = 

//         const response = await Place.aggregate([
//             {
//                 '$search': {
//                     'index':'name_1',
//                     'autocomplete': {
//                         'query': title,
//                         'path': 'name'
//                     }
//                 }
//             }, 
//             {
//                 '$limit': 5
//             },           
//             {
//                 '$project': {
//                     'name': 1,
//                     '_id': 1
//                 }
//             }
            
//         ]);

//         console.log(response);

//         res.json({status:200,data:response});

//     } catch (error) {

//         console.log(error)

//         return res.json({status:400,message:error.message});

//     }

// })
app.get("/hotels",async (req,res) => {
    let placeId = req.query.placeId,
    start = req.query.start,
    end = req.query.end,
    minPrice = req.query.minPrice || 0,
    maxPrice = req.query.maxPrice || Number.MAX_VALUE;
    console.log(req.query.rating);
    const hotelData = []
    try{
        let hotelIds = await Place.findById(placeId,"hotels");
        console.log(hotelIds);
        let hotels = await Hotel.find({
            '_id':{ $in: hotelIds.hotels},
            avgRating:{ $gte:new Number(req.query.rating) || 0 }
        }).populate('rooms');
        // await hotels;
        console.log(hotels);
        for(let i=0;i<hotels.length;i++){
            let hotel = hotels[i];
            var count = 0;
            for(let j=0;j<hotel.rooms.length;j++){
                let room = hotel.rooms[j];
                if(room.price<minPrice || room.price>maxPrice){
                    console.log("price if");
                    continue;
                }
                let roomReservations = RoomReservation.find({roomId:room.id}).populate("reservationId").cursor();
                
                // if(roomReservations.constructor.name!="Array"){
                //     roomReservations = [].concat(roomReservations);
                // }
                
                await helper.getNonOverlappingCount(roomReservations,start,end).then((c)=>{
                    console.log(c);
                    count+=c;
                    console.log(count);
                });
                
            }

            if(count!=0){
                hotelData.push({name:hotel.name,address:hotel.address,availability:count,image:hotel.image});
            }
        }
        
        res.json({status:200,data:hotelData});
    }catch(e){
        
        console.log(e.stack);
        res.json({status:404,data:e.message});
    }
})
app.get("/hotels/:id",async (req,res)=>{
    let start = req.query.start,
    end = req.query.end,
    minPrice = req.query.minPrice && 0,
    maxPrice = req.query.maxPrice && Number.MAX_VALUE;
    try{
        const hotel = await Hotel.findById(req.params.id).populate('rooms').populate('reviews');
        for(let j=0;j<hotel.rooms.length;j++){
            let room = hotel.rooms[j];
            if(room.price<minPrice || room.price>maxPrice){
                console.log("price if");
                continue;
            }
            let roomReservations = RoomReservation.find({roomId:room.id}).populate("reservationId").cursor();
            
            await helper.getNonOverlappingCount(roomReservations,start,end).then((c)=>{
                if(c==0){
                    delete hotel.rooms[j];
                }
            });
            
        }
        res.json({status:200,hotel:hotel});
    }catch(e){
        console.log(e.stack);
        res.json({status:400,message:e.message});
    }

})
app.get('/flights',async (req,res)=>{
    try{
        let src = req.query.source,
        des = req.query.destination,
        date = new Date(req.query.date),
        tomorrow = new Date(date.getTime() + (24 * 60 * 60 * 1000))
        let filter = {source: src, destination:des,departureDate: {$gte:date,$lte:tomorrow}}
        console.log(filter);
        let flights = await Flight.find(filter);
        res.json({status:200,data:flights});
    }catch(err){
        console.log(err.stack);
        res.json({status:400,message:err.message});
    }
})
app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});
