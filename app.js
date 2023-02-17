const express = require('express'),
     mongoose = require('mongoose'),
     cors = require('cors'),
     passport = require('passport'),
     localStrategy = require('passport-local')
     flash = require('flash'),
     User = require('./models/userDetails'),
     Credentials = require('./models/credentials');

mongoose.connect('mongodb+srv://tourWizardAdmin:strongPassword@cluster0.rusp7.mongodb.net/tourWizard?retryWrites=true&w=majority');

const app = express();
const PORT = process.env.PORT || 8080;


app.use(require("express-session")({
	secret:"A random sequence of words, which are to ensure the cryptograpy is safe and sound :)",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(Credentials.authenticate()));
passport.serializeUser(Credentials.serializeUser());
passport.deserializeUser(Credentials.deserializeUser());

app.use(express.json());
app.use(express.urlencoded());

app.get('/index', (req, res) => {
    res.send('<div><a href=/login>Login</a></div><a href=/register>register</a>');
})
app.post('/login',passport.authenticate('local',{
    successRedirect:'/index',
    failureRedirect:'/login'
}),(req,res)=>{

})
app.get('/login',(req,res)=>{
    res.sendFile('public/login.html',{root:__dirname});
})
app.get('/register',(req,res)=>{
    res.sendFile('public/register.html',{root:__dirname});
})
app.post('/register',async (req,res)=>{
    try{
        const creds = await Credentials.register(new Credentials({username:req.body.username}),req.body.password);
        const user = await User.create({email:req.body.email,fn:req.body.fn,ln:req.body.ln,phone:req.body.phone});
        
        user.credId = creds.id;
        await user.save();
        passport.authenticate('local')(req, res, ()=>{
            res.redirect('/index')
        });
    }catch(err){
        console.log(err);
        res.redirect('/register');
    }
})
app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
})
