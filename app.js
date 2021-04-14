const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const moment = require('moment');
const morgan = require('morgan');
const fetch = require('node-fetch');
const auth = require('./middleware/auth');
const Player = require('./models/player');
let submit = {
    success: false,
    error: {
        status: false,
        msg: ''
    }
}
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
app.get('/', async(req, res) => {
    
    // Reset submit
    submit = {
        success: false,
        error: {
            status: false,
            msg: ''
        }
    }

    // Render the page
    await renderMainPage(req, res);

});

// Default route
app.post('/', async(req, res) => {

    // First, check if every input field is filled in
    const name = req.body.name;
    const tetrio = req.body.tetrio;

    // Check if fields are filled in
    if(name === "" || tetrio === "") {

        // An empty field was found, show to the user an error message
        submit = {
            success: false,
            error: {
                status: true,
                msg: 'Niet alle velden werden ingevuld'
            }
        }

        // Render page
        await renderMainPage(req, res);

    } else {
        
        // Check if the tetrio username is know in the API
        const url = `${process.env.LOCALPATH}/api/user/${tetrio}`;

        // Get the response
        const response = await fetch(url, {
            method: 'get',
            headers: {
                'Authorization': `Bearer ${process.env.LOCAL_JWT_KEY}`,
            }
        });

        // Get the data
        const body = await response.json();

        // Check for errors
        if(!body.ok || body.data.user.role === 'anon') {

            // The tetrio user was not found or is not a registered user
            submit.error = {
                status: true,
                msg: 'Het opgegeven Tetrio account is niet gevonden. Ben je zeker dat de gebruikersnaam juist is?'
            }

            // Render page
            await renderMainPage(req, res);

        } else {

            // PCheck if the user is already in the database
            Player.find({userid: body.data.user._id}, async(err, docs) => {
                if(docs.length) {

                    // The tetrio user was not found or is not a registered user
                    submit.error = {
                        status: true,
                        msg: 'De opgegeven tetrio gebruikersnaam is reeds geregistreerd voor dit toernooi'
                    };

                    // Render page
                    await renderMainPage(req, res);

                } else {

                    // All checks are ok, Create a new Player
                    const player = new Player({
                        userid: body.data.user._id,
                        name: name,
                        username: body.data.user.username,
                        xp: body.data.user.xp,
                        gamesplayed: body.data.user.gamesplayed,
                        gameswon: body.data.user.gameswon,
                        gametime: body.data.user.gametime,
                        country: body.data.user.country
                    });

                    // Save the created player to the MongoDB
                    player.save()
                    .then(async (result) => {

                        // Set success
                        submit.success = true;

                        // Render page
                        await renderMainPage(req, res);

                    })
                    .catch((err) => {
                        submit.error = {
                            status: true,
                            msg: 'Er is een onverwachte fout opgetreden. Probeer later opnieuw'
                        };
                    });

                }
            });

        }

    }

});

const renderMainPage = async(req, res) => {
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
            return res.status(503).render('index', { title: 'Home', isAlert: true, alertTitle: "Er liep iets fout bij het ophalen van de gebruikers!", players: {}, submit });
        
        // Render the page
        res.render('index', { title: 'Home', isAlert: false, alertTitle:'', players: body, moment, submit });

    } catch(err) {
        return res.status(501).render('index', { title: 'Home', isAlert: true, alertTitle: "Er is een onverwachte fout opgetreden!", players: {}, submit });
    }
}

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
    return res.status(200).json({
        ok: true,
        data
    });
});

// Default 404 page when nothing was hit
app.use((req, res) => {
    res.status(404).render('404');
})