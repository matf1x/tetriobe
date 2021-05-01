// Require other packages
const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const morgan = require('morgan');
const fetch = require('node-fetch');

// Require custom packages
const User = require('./partials/User');
const Game = require('./partials/Game');
const json = require('./partials/JSON');

// Require the middleware packages
const auth = require('./middleware/auth');

// Load the models we need
const Player = require('./models/player');

// Require other stuff
require('dotenv').config();

// Create variables that we need for output
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
app.use(express.json());
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

    // Reset submit
    submit = json.createOutput(false, '', false, '');

    // Render the page
    await renderMainPage(req, res);

    /** First, reset submit
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
        return renderMainPage(req, res);

    }

    // Get the User information from the API
    User.getUserInfo(tetrio)
        .then(async(userInfo) => {
            // Then, we search if the player already is known in the database
            docs = await Player.find({userid: userInfo.id});

            // Check if there are any docs known
            if(docs.length) { 
                submit = json.createOutput(false, {}, true, 'De opgegeven TETRIO gebruiker is reeds gevonden in de deelnemerslijst.'); 
            } else {
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

                // Now, save the player to the database
                await player.save()
                .then(async (result) => {
                    // Set success
                    submit = json.createOutput(true, {}, false, '');
                })
                .catch((err) => {
                    // Set the submit
                    submit = json.createOutput(false, {}, true, 'Er is een onverwachte fout opgetreden. Probeer later opnieuw.');
                });
            }

            // Render page
            renderMainPage(req, res);
        })
        .catch((err) => { submit = json.createOutput(false, {}, true, 'De opgegeven TETRIO gebruiker werd niet gevonden.'); renderMainPage(req, res); });
    **/
});

/* --------------------------------
 * Brackets
 * Method: Get
 * Description: This will show a specific bracket and the players + stats
 * Params: @id (string)
 * -------------------------------- */
app.get('/bracket/:id', async(req, res) => {

    // Setup helpers
    let isAlert = false;
    let alertTitle = '';
    const bracket = parseInt(req.params['id']);

    // Get the players from the specific bracket
    User.getBracketPlayers(bracket)
        .then((data) => {
            // Parse the players
            const players = JSON.parse(data);

            // Render the page
            res.render('bracket', { title: `Bracket ${bracket}`, players });
        })
        .catch((err) => { console.log(err); res.status(500).render('500', { title: '500', isAlert, alertTitle }); })
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
        User.getAllUsers()
            .then((data) => {
                // Get the players & parse them
                players = JSON.parse(data);

                // Render the page
                res.render('index', { title: 'Home', players, moment, submit });
            }).catch(err => {
                // A error returned from the promise, show a error page
                res.status(500).render('500', { title: '500' });
            });
    } catch(err) {
        // An error occured, render the error page
        res.status(500).render('500', { title: '500' });
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

        // Before we start, we will get all the users
        User.getAllUsers()
            .then((data) => {

                // Parse the data into a understandable format
                players = JSON.parse(data);

                // Loop in the player array
                for(const id in players) {

                    // Update the current user
                    User.updateUser(players[id]._id, players[id].username)
                    .then(() => {
                        console.log('Updated ' + players[id].username + ' successfully');
                    })
                    .catch((err) => {
                        console.log('Error with updating ' + players[id].username + '');
                    });

                }

                // When all users are updated, return status 200
                res.status(200).json({
                    ok: true,
                    msg: 'All users are updated'
                });

            })
            .catch((err) => { console.log(err); res.status(500).json({ok: false, msg: err }); })

    } catch(err) {
        console.log(err);
        return res.status(500).json({
            ok: false,
            msg: err
        });
    }

});

/* --------------------------------
 * API | Bracket info
 * Method: POST
 * Description: Set the correct bracket & add the correct lines for the scoreboard
 * Params: @name (String), @bracket (Number)
 * -------------------------------- */
app.post('/api/players/bracket', auth, async(req, res) => {

    // Try to execute
    try {
        // Get the correct variables
        const players = req.body;

        // Loop trough the players
        for(const id in players) {

            // Update the information
            User.updateTournamentUser(players[id].username, players[id].bracket)
                .then(() => {  })
                .catch((err) => { console.log(err); })

        }

        // Send OK message
        res.json({ok: true });

    } catch(err) {
        res.status(500).json({ok: false, msg: err });
    }
    

})

/* --------------------------------
 * API | Enter the results
 * Method: POST
 * Description: This will process the results of a game
 * Params: @output (String)
 * -------------------------------- */
app.post('/api/games/add', auth, async(req, res) => {
    
    console.log(req.body.results);

    // Convert the output
    try {
        Game.convertOutput(req.body.results)
            .then((plrs) => {

                // Loop trough the players
                for(const id in plrs) {

                    // Update the user in the database
                    User.updateUserAfterGame(plrs[id])
                        .catch((err) => {
                            console.log(`Speler ${plrs[id].name} kon niet worden geupdate`);
                        });

                }

                // Return status 200 to let the user know the process was successfull
                res.status(200).json({ok: true, plrs });

            })
            .catch((err) => { return res.status(500).json({ok: false, msg: 'Onfortuinlijk' }); });

    } catch(err) {
        res.status(500).json({ok: false, msg: err });
    }
    

});

/* --------------------------------
 * API | Get the players
 * Method: GET
 * Description: This will return all the players
 * output: @players (String)
 * -------------------------------- */
app.get('/api/players/list', auth, async(req, res) => {

    // Get all the players
    User.getAllUsers()
        .then((data) => {
            const players = JSON.parse(data);
            res.json(players);
        })
        .catch((err) => {
            res.status(500).json({ok: false, msg: err });
        })

});

/* --------------------------------
 * API | Get a specific player
 * Method: GET
 * Description: This will return all the players
 * output: @players (String)
 * -------------------------------- */
app.get('/api/player', async(req, res) => {
    
    // Get the username
    const username = req.body.username.toLowerCase();

    // Get the user info from the databae
    User.getUserInfo(username)
        .then((userInfo) => {

            // Set a temp usermap
            let userMap = {};

            // Create the output
            const player = {
                _id: userInfo.id,
                userid: userInfo.id,
                name: userInfo.username,
                username: userInfo.username,
                xp: userInfo.exp,
                gamesplayed: userInfo.gamesPlayed,
                gameswon: userInfo.gamesWon,
                gametime: userInfo.secondsPlayed,
                country: userInfo.country,
                tetraleague: userInfo.tetraLeague,
                sprint: userInfo.records.sprint,
                joinDate: userInfo.joinDate
            };

            // Put info into userMap
            userMap[userInfo.id] = player;

            // create the correct output
            res.json(userMap);
        })
        .catch((err) => {
            res.status(500).json({ok: false, msg: err });
        })

})

/* --------------------------------
 * API | Add a specific player
 * Method: POST
 * Description: This will add a specified user
 * params: @username (String)
 * -------------------------------- */
app.post('/api/player/add', async(req, res) => {

    // Get the username
    const username = req.body.username.toLowerCase();

    // Setup userinfo holder
    let userInfo= '';

    // Get the User information from the API
    User.getUserInfo(username)
        .then(async(userInfo) => {
            // Then, we search if the player already is known in the database
            docs = await Player.find({userid: userInfo.id});

            // Check if there are any docs known
            if(docs.length) { 
                res.status(500).json({ok: false, msg: 'User already registered' });
            } else {
                // Create a player model
                const player = new Player({
                    userid: userInfo.id,
                    name: username,
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

                // Now, save the player to the database
                await player.save()
                .then(async (result) => {
                    // Output OK
                    res.json({ok: true });
                })
                .catch((err) => {
                    // Set the submit
                    res.status(500).json({ok: false, msg: err });
                });
            }
        })
        .catch((err) => { res.status(500).json({ok: false, msg: err }); });

});

/* --------------------------------
 * API | Delete a specific player
 * Method: POST
 * Description: This will delete a specified user
 * params: @username (String)
 * -------------------------------- */
app.post('/api/player/delete', async(req, res) => {

    // Get the username
    const username = req.body.username.toLowerCase();

    // Delete the user
    await Player.deleteMany({ username: username })
        .then(() => {
            res.json({ok: true});
        })
        .catch((err) => {
            // Set the submit
            res.status(500).json({ok: false, msg: err });
        });

});

/* --------------------------------
 * 404 pages
 * Description: This will be called when no other routes are called
 * -------------------------------- */
app.use((req, res) => {
    res.status(404).render('404', { title: '500' });
})