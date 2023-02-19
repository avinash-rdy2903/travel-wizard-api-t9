require('dotenv').config();
const express = require('express'),
     mongoose = require('mongoose'),
     cors = require('cors'),
     passport = require('passport'),
     localStrategy = require('passport-local')
     googleStrategy = require('passport-google-oauth20').Strategy;
     flash = require('flash'),
     User = require('./models/userDetails'),
     Credentials = require('./models/credentials'),
     jwt = require('jsonwebtoken');
     nodeMailer = require('nodemailer');

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

app.use(cors());
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
    callbackURL: "http://localhost:8080/auth/google/callback",
    passReqToCallback  : true
},async (request, accessToken, refreshToken, profile, done) => {
    console.log(profile);
    const googleUser = profile._json;
    let user = await User.findOne({email: googleUser.email});
    if(user==null) {
        user = await User.create({email:googleUser.email,fn:googleUser.given_name,ln:googleUser.family_name,verified:googleUser.email_verified});
    }    
    return done(null, profile);
}
));
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req, res) => {
    res.send('<div><a href=/login>Login</a></div><a href=/register>register</a>');
})
app.post('/login',passport.authenticate('local',{
    failureRedirect:'/login/failure',
    successRedirect: '/login/success'
}))
app.get('/login/:action',(req,res)=>{
    if(req.params.action==='failure'){
        res.json({status:401,redirect:'/'})
    }
    let username = req.body.username;
    if(req.user.provider==='google'){
        username = req.user._json.given_name;
    }
    res.json({status:200,redirect:'/',username:username});
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
app.get('/register',(req,res)=>{
    res.sendFile('public/register.html',{root:__dirname});
})
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
                 res.redirect('/index');
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
            html: `<h3>Hello ${req.body.ln}</h3><div> Please click <a href="http://localhost:${process.env.PORT}/verify/email/${user.id}/${token}>this link</a> to verify your email ID.</div><div>Thank you for joining Travel Wizard</div>`
        };
        let info = await transporter.sendMail(mailOptions);
        await user.save();
        passport.authenticate('local')(req, res, ()=>{
            res.redirect('/index')
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
app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
})
