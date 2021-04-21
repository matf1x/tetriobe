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
    getUserInfo: async(id, callback) => {

        // Get the users information
        await tetrioAPI.getUser({ user: id }).then((user) => {
            callback(false, user);
        })
        .catch((err) => {
            callback(true, 'De opgegeven TETR.IO gebruiker werd niet gevonden');
        });

    },

    // Get all the users from the database
    getAllUsers: (Player) => {

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

    updateUser: async(id, name, Player, callback) => {

        // First, get the userinfo for this user
        try{
            const user = await module.exports.getUserInfo(name.toLowerCase(), async(err, userInfo) => {
                // Check for errors
                if(err) {
                    return callback(false);
                }

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

                // Update the user
                Player.updateOne({_id:id}, player)
                    .then(doc => {
                        // Check if a doc is returned, if not, send error
                        if(!doc) { return callback(false); }
                    })
                    .catch(err => { return callback(false) });

                // Return callback true to let the script know that the update was succesfull
                callback(true);
                
            });
        } catch(err) {
            return callback(false);
        }
        
    }

}