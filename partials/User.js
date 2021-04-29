// Import other packages
const tetrio = require('tetrio-node');
const Player = require('../models/player');
require('dotenv').config();

// Create the Tetrio API
const tetrioAPI = new tetrio.Api(`${process.env.TETRIO_TOKEN}`, {
    notFoundAsError: true
});

// Create the exports
module.exports = {

    // Check the fields
    checkFields: (name, user) => {
        if(name === "" || user === "")
            return false;
        else
            return true;
    },

    // Get the user information
    getUserInfo: (user) => {

        // Create a new Promise
        return new Promise((resolve, reject) => {

            // Get the info from the TETRIO API
            tetrioAPI.getUser({ user })
                .then((info) => { resolve(info) })
                .catch((err) => { reject(err) });

        });

    },

    /* --------------
     * get All Users
     * Retrieve all players from the MongoDB database
     * -------------- */
    getAllUsers: () => {

        // Create a new Promise
        return new Promise((resolve, reject) => {
            // Search all players
            Player.find({}, (err, users) => {
                // Create a empty usermap
                let userMap = {};
    
                // Loop trough the users
                users.forEach(function(user) {
                    userMap[user._id] = user;
                });
    
                // Callback the usermap
                resolve(JSON.stringify(userMap));
            }).catch((err) => {
                reject(err);
            })
        });

    },

    /* --------------
     * get players from specific bracket
     * Retrieve all players from a specific bracket from the MongoDB database
     * -------------- */
    getBracketPlayers: (bracket) => {

        // Create a new Promise
        return new Promise((resolve, reject) => {
            // Search all players
            Player.find({bracket:bracket}).sort('-points').exec((err, users) => {

                // Check for errors
                if(err) reject(err);

                // Create a empty usermap
                let userMap = {};
                let counter = 1;
    
                // Loop trough the users
                users.forEach(function(user) {
                    userMap[counter] = user;
                    counter++;
                });
    
                // Callback the usermap
                resolve(JSON.stringify(userMap));
            })
        });

    },

    /* --------------
     * Update User
     * This will update the user in the database. First, we get the new information from API
     * Then we do an update in the database with the new info
     * -------------- */
    updateUser: (id, name) => {

        // Create a new Promise
        return new Promise((resolve, reject) => {

            // Get the correct user information
            module.exports.getUserInfo(name.toLowerCase())
                .then((userInfo) => {
                    // Create a player model
                    const player = {
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
                    };

                    // Update the player in the database
                    Player.updateOne({_id:id}, player)
                    .then(doc => {
                        // Check if a doc is returned, if not, send error
                        if(!doc) { reject() }

                        // All went smooth, resolve the Promise
                        resolve();
                    })
                    .catch(err => { reject(err); });
                })
                .catch((err) => { reject(err); })

        });
        
    },

    /* --------------
     * Add tournament information
     * This will add the tournament information for the user
     * -------------- */
    updateTournamentUser: (id, bracket) => {

        return new Promise((resolve, reject) => {

            // Create a new player
            const player = {
                bracket: bracket,
                points: 0,
                lines: {
                    given: 0,
                    received: 0
                }
            }

            // Add those fields to the given user
            Player.updateOne({username:id}, {$set: player}, { new: true, strict: false })
                .then((doc) => {
                    // Check if we received feedback. If not, send a reject, otherwise, send a resolve
                    if(!doc) reject();
                    resolve();
                })
                .catch((err) => reject(err));

        });

    },
     
    /* --------------
     * Update User after game
     * Update the user after a game is done.
     * This will be called after we post the results & the Game Converter has run
     * -------------- */
    updateUserAfterGame: (user) => {

        // Create a new Promise
        return new Promise((resolve, reject) => {

            // Create a const with the correct fields
            const player = {
                points: user.points,
                "lines.given": Number(user.lines.sent),
                "lines.received": Number(user.lines.get)
            }

            // Update the user in the database
            Player.updateOne({username:user.name}, {$inc: player}, { new: true, strict: false })
                .then((doc) => {
                    // Check if we received feedback. If not, send a reject, otherwise, send a resolve
                    if(!doc) reject();
                    resolve();
                })
                .catch((err) => reject(err));

        })

    }

}