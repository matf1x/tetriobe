// Import other packages
const tetrio = require('tetrio-node');
require('dotenv').config();

// Create the Tetrio API
const tetrioAPI = new tetrio.Api(`${process.env.TETRIO_TOKEN}`, {
    notFoundAsError: true
})

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
    getAllUsers: async(Player, callback) => {

        // Get all the players
        await Player.find({}, (err, users) => {
            // Create a empty usermap
            let userMap = {};

            // Loop trough the users
            users.forEach(function(user) {
                userMap[user._id] = user;
            });

            // Callback the usermap
            callback(JSON.stringify(userMap));
        })

    }

}