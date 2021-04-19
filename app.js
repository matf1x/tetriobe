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
    })

    // Check if the player is already in the database
    Player.find({userid: userInfo.id}, async(err, docs) => {
        if(docs.length) {

            // Set the submit
            submit = json.createOutput(false, {}, true, 'De opgegeven TETR.IO gebruiker is reeds ingeschreven');

            // Render page
            await renderMainPage(req, res);

        }
    });

    // When all previous steps are ok, save the player to the database
    player.save()
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
        await User.getAllUsers(Player, (data) => {
            // Setup the players
            players = JSON.parse(data);
        });

        // Render page
        res.render('index', { title: 'Home', isAlert, alertTitle, players, moment, submit });

    } catch(err) {
        // Setup error handling
        isAlert = true;
        alertTitle = 'Er is een onverwachte fout opgetreden.';
        console.log(err);

        // Render page
        await res.render('index', { title: 'Home', isAlert, alertTitle, players, moment, submit });
    }
}

/* --------------------------------
 * 404 pages
 * Description: This will be called when no other routes are called
 * -------------------------------- */
app.use((req, res) => {
    res.status(404).render('404');
})