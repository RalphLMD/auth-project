//jshint esversion:6
require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
//const encrypt = require("mongoose-encryption")
//const md5 = require("md5")
const bcrypt = require("bcrypt")
const saltRounds = 10

const session = require("express-session")

const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
var GoogleStrategy = require('passport-google-oauth2').Strategy
const findOrCreate = require("mongoose-findorcreate")


const app = express()


app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}))

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

//userSchema.plugin(encrypt, {secret:process.env.SECRET ,encryptedFields:["password"]})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema)

// SESSION

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(User.createStrategy())

// passport.serializeUser(User.serializeUser())
// passport.deserializeUser(User.deserializeUser())

// passport.serializeUser(function(user, done){
//     done(null, user.id)
// })

// passport.deserializeUser(function(id, done){
//     User.findById(id, function(err, user){
//         done(err, user)
//     })
// })

// passport.deserializeUser(function(id, done){
//     User.findById(id).then(function(user){
//        done(user)
//        console.log("You are here!")
//     }).catch(function(err){

//     })
// })

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    User.findById(id).then(function(user){
        done(user)
    }).catch(function(err){
        done(err)
    })
})

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user)
    })
  }
))


app.listen(3000, function(){
    console.log("Server is running!")
})

app.get("/", function(request, response){
    response.render("home")
})

app.get("/login", function(request, response){
    response.render("login")
})

app.get("/register", function(request, response){
    response.render("register")
})

app.get("/secrets", function(request, response){
     
    if (request.isAuthenticated()){
        response.render("secrets")
    } else {
        response.redirect("/login")
    }

    //response.render("secrets")

    // User.find({})
    // .then(function(){
    //     response.render("secrets")
    // }).catch(function(err){
    //     console.log(err)
    //     response.redirect("/")
    // })

})

app.get("/submit", function(request, response){
    response.render("submit")
})

// REGISTER NEW USER

// USING PASSPORT JS

app.post("/register", function(request, response){

    User.register({username: request.body.username}, request.body.password, function(err, user){
        if (err) {
            console.log(err)
            response.redirect("/register")
        } else {
            response.redirect("/login")
        }
    })

    // USING BCRYPT
    
    // bcrypt.hash(request.body.password, saltRounds)
    // .then(function(hash){   

    //     const newUser = new User({
    //             email: request.body.username,
    //             password: hash
    //         })
    //         newUser.save()

    //     console.log("New user has been registered!")
    //     response.redirect("/login")

    // }).catch(function(err){
    //     console.log(err)
    // })

    // USING MD5

    // const newUser = new User({
    //     email: request.body.username,
    //     password: request.body.password,
    //     //password: md5(request.body.password),
    // })

    // newUser.save()
    // .then(function(){
    //     console.log("New user has been registered!")
    //     response.redirect("/login")
    // })
    // .catch(function(err){
    //     console.log(err)
    // })
})

// LOGIN USER

app.post("/login", function(request, response){

    // USING PASSPORT JS

    passport.authenticate("local")(request, response, function(){
        response.redirect("/secrets")
    })

    // const username = request.body.username
    // const password = request.body.password
    // const password = md5(request.body.password)

    // USING BCRYPT

    // User.findOne({email: username})
    // .then(function(foundUser){
    //     bcrypt.compare(password, foundUser.password)
    //     .then(function(result){
    //         if (result === true) {
    //             response.render("secrets")
    //         }
    //     })
    // })
    // .catch(function(err){
    //     console.log(err)
    // })

    // USING MD5

    // User.findOne({email: username})
    // .then(function(foundUser){
    //     if(foundUser.password === password){
    //         response.render("secrets")
    //     }
    // })
    // .catch(function(err){
    //     console.log(err)
    // })
})

app.get("/logout", function(request, response){
    request.logout(function(){
        response.redirect("/")
    })
})

app.get("/auth/google",
  passport.authenticate("google", { scope:
      [ "email", "profile" ] }
))

app.get( '/auth/google/secrets',
    passport.authenticate( "google", {failureRedirect: "/login"}), 
    function(request, response){
        response.redirect("/secrets")
    })