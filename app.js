const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const moment = require('moment');
const morgan = require('morgan');
const fetch = require('node-fetch');
const auth = require('./middleware/auth');
const Player = require('./models/player');
require('dotenv').config();

// Check if global fetch is available
if (!globalThis.fetch) {
	globalThis.fetch = fetch;
}

// Create express app
const app = express();

// Setup view engine
app.set('view engine', 'ejs');

// setup mongoose
const mongodbURI = `mongodb+srv://${process.env.MONGDB_USERNAME}:${process.env.MONGDB_PASSWORD}@twitchbecluster.pr0qo.mongodb.net/twitchbe?retryWrites=true&w=majority`;
mongoose.connect(mongodbURI, {useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        // Start listening for requests
        app.listen(process.env.PORT || 4000);
    })
    .catch((err) => console.log(err));

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Default route
app.get('/', (req, res) => {
    res.render('index', { title: 'Home'});
});

app.get('/users', async(req, res) => {
    // First, call the API to get all the users
    const url = `${process.env.LOCALPATH}/api/users`;

    // Fetch info from the API
    try {

        const response = await fetch(url, {
            method: 'get',
            headers: {
                'Authorization': `Bearer ${process.env.LOCAL_JWT_KEY}`,
            }
        });

        // Get the text and put it into a variable
        const body = await response.json();

        if(body.ok !== undefined)
            return res.status(503).render('players', { title: 'Spelers', isAlert: true, alertTitle: "Er liep iets fout bij het ophalen van de gebruikers!", players: {} });
        
        // Render the page
        res.render('players', { title: 'Spelers', isAlert: false, alertTitle:'', players: body, moment });

    } catch(err) {
        console.log(err);
        return res.status(501).render('players', { title: 'Spelers', isAlert: true, alertTitle: "Er is een onverwachte fout opgetreden!", players: {} });
    }
})

// API Stuff
// Get all users
app.get('/api/users', auth, async(req, res) => {

    // Get all the players from the mongoDB
    Player.find({}, (err, users) => {
        var userMap = {};

        users.forEach(function(user) {
            userMap[user._id] = user;
        });

        res.json(users);

    });

});

// Get the room status
app.get('/api/user/:name', auth, async(req, res) => {
    // Get the room key
    const name = req.params.name.toLowerCase();

    // Next, call the TETR.IO api
    const url = `${process.env.TETRIO_API}/users/${name}`;

    const response = await fetch(url, {
        method: 'get'
    });

    // Get the text and put it into a variable
    const body = await response.json();

    // Check if we found someone with the given name
    if(!body.success)
        return res.status(401).json({
            ok: false,
            error: body.error
        });

    // Get the data
    const data = body.data;
    const cache = body.cache;

    // First, check if the user is already created in the database
    Player.find({userid: data.user._id}, (err, docs) => {
        if(docs.length) 
            return res.status(401).json({
                ok: false,
                error: 'The given user is already added to the database'
            });
    });

    // Create a new Player
    const player = new Player({
        userid: data.user._id,
        username: data.user.username,
        xp: data.user.xp,
        gamesplayed: data.user.gamesplayed,
        gameswon: data.user.gameswon,
        gametime: data.user.gametime,
        country: data.user.country
    });

    // Save the created streamer to the MongoDB
    player.save()
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            console.log(err);
            return res.status(401).json({
                ok: false,
                error: 'Something went wrong when saving the information to the database'
            });
        });
});

// Default 404 page when nothing was hit
app.use((req, res) => {
    res.status(404).render('404');
})