// Require other packages
const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const moment = require('moment');
const morgan = require('morgan');
const fetch = require('node-fetch');
const auth = require('./middleware/auth');
const Player = require('./models/player');
const User = require('./partials/User');
const json = require('./partials/JSON');
require('dotenv').config();

// Other variables for help
let submit = {};

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

/* --------------------------------
 * Main page
 * Method: Get
 * Description: Render the main page with all his info
 * -------------------------------- */
app.get('/', async(req, res) => {
    
    // Reset submit
    submit = json.createOutput(false, '', false, '');

    // Render the page
    await renderMainPage(req, res);

});

/* --------------------------------
 * Main page
 * Method: Post
 * Description: Handles the registration form. This will check if the form is filled in,
 * The user excists on the TETR.IO database & if the user is already registered or not
 * -------------------------------- */
app.post('/', async(req, res) => {

    // First, reset submit
    submit = json.createOutput(false, '', false, '');

    // Get the form information
    const name = req.body.name;
    const tetrio = req.body.tetrio.toLowerCase();
    let userInfo= '';

    // Check if the fields are filled in
    if(!User.checkFields(name, tetrio)) {

        // Set the submit
        submit = json.createOutput(false, {}, true, 'Niet alle velden werden ingevuld');

        // Render page
        await renderMainPage(req, res);

    }

    // Check if a user was found
    await User.getUserInfo(tetrio, async(err, info) => {
        // Check for errors
        if(err) {
            // Set the submit
            submit = json.createOutput(false, {}, true, info);

            // Render page
            await renderMainPage(req, res);
        }

        userInfo = info;
    });

    // Check if the player is already in the database
    Player.find({userid: userInfo.id}, async(err, docs) => {
        if(docs.length) {

            // Set the submit
            submit = json.createOutput(false, {}, true, 'De opgegeven TETR.IO gebruiker is reeds ingeschreven');

            // Render page
            await renderMainPage(req, res);

        }
    });

    // Create a player model
    const player = new Player({
        userid: userInfo.id,
        name: name,
        username: userInfo.username,
        xp: userInfo.exp,
        gamesplayed: userInfo.gamesPlayed,
        gameswon: userInfo.gamesWon,
        gametime: userInfo.secondsPlayed,
        country: userInfo.country,
        tetraleague: userInfo.tetraLeague,
        sprint: userInfo.records.sprint,
        joinDate: userInfo.joinDate
    });

    // When all previous steps are ok, save the player to the database
    await player.save()
    .then(async (result) => {
        // Set success
        submit = json.createOutput(true, {}, false, '');
    })
    .catch((err) => {
        // Set the submit
        submit = json.createOutput(false, {}, true, 'Er is een onverwachte fout opgetreden. Probeer later opnieuw.');
    });

    // Render page
    await renderMainPage(req, res);

});

/* --------------------------------
 * Render Main Page
 * Method: async function
 * Description: Get the current players from the API, after that, render the index page
 * -------------------------------- */
const renderMainPage = async(req, res) => {

    // Setup helpers
    let players = {};
    let isAlert = false;
    let alertTitle = '';

    // Try to get the players
    try {
        // Get all the players
        User.getAllUsers(Player)
            .then((data) => {
                // Get the players & parse them
                players = JSON.parse(data);

                // Render the page
                res.render('index', { title: 'Home', isAlert, alertTitle, players, moment, submit });
            }).catch(err => {
                // A error returned from the promise, show a error page
                res.status(500).render('500', { title: '500', isAlert, alertTitle });
            });

    } catch(err) {
        // An error occured, render the error page
        res.status(500).render('500', { title: '500', isAlert, alertTitle });
    }

}

/* --------------------------------
 * API | Refresh the players
 * Method: GET
 * Description: This will refresh the stats of the users that are registered
 * -------------------------------- */
app.get('/api/players/refresh', auth, async(req, res) => {

    // Create a holder for the players
    let players = {};
    
    // Get all the users and put them into a holder
    try {
        // Get all the players
        await User.getAllUsers(Player, (data) => {
            // Setup the players
            players = JSON.parse(data);
        });

        // Loop trough the users to get the next one
        for(const id in players) {

            let apiStatus = false;

            // Get the newest info for this user from the TETR.IO API
            await User.updateUser(players[id]._id, players[id].username, Player, (status) => {
                // Put the status into the holder
                apiStatus = status;
            });

            // Stop the for loop when we receive an error
            if(!apiStatus) {

                // Return the status
                return res.status(500).json({
                    ok: false,
                    msg: `Er is een fout ontdekt bij het updaten van ${players[id].username}`
                });

                // Break the loop
                break;
            }

        }

        // When all ok, return status 200
        res.status(200).json({
            ok: true,
            msg: ''
        })

    } catch(err) {
        return res.status(500).json({
            ok: false,
            msg: err
        });
    }

});

/* --------------------------------
 * 404 pages
 * Description: This will be called when no other routes are called
 * -------------------------------- */
app.use((req, res) => {
    res.status(404).render('404', { title: '500' });
})