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
                .catch((err) => { console.log(err); reject(err) });

        });

    },

    /* --------------
     * get All Users
     * Retrieve all players from the MongoDB database
     * -------------- */
    getAllUsers: (Player) => {

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
     * Update User
     * This will update the user in the database. First, we get the new information from API
     * Then we do an update in the database with the new info
     * -------------- */
    updateUser: (id, name, Player) => {

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
        
    }

}