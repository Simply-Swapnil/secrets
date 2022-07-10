
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//Using express-session module
app.use(session({
    secret: 'The key to all', 
    resave: false,
    saveUninitialized: false
}));

//Using passport module
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({ 
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
//This plugin uses salting and hashing automatically.

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());  //create session cookie and enables user access without reapeted authentication
passport.deserializeUser(User.deserializeUser());   //destroy session cookie

app.get('/', function(req, res) {
    res.render('home');
})

app.get('/login', function(req, res) {
    res.render('login');
})

app.get('/register', function(req, res) {
    res.render('register');
})

app.get('/secrets', function(req, res) {
    if(req.isAuthenticated()){
        res.render('secrets');
    }else{
        res.redirect('/login');
    }
})

app.get('/logout', function(req, res){
    //callback is made necessary now else only req.logout() was sufficient
    req.logout(function(err){
        if(err){ return next(err);}
        res.redirect('/');
    });
    
})

app.post('/register', function(req, res) {

    const username = req.body.username;
    const password = req.body.password;

    //Before it was needed to create new user model and then save it. But the modules enable new methods.
    User.register({username: username}, password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        }else{
            //The local implies local strategy i.e. using username and password for aurthentication.
            passport.authenticate('local')(req, res, function(){  
                res.redirect('/secrets');
            })
        }
    })

})

app.post('/login', function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            })
        }
    })

})

app.listen(3000, function(){
    console.log('Server started on port 3000...');
})