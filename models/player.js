const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// setup MongoDB schema
const playerSchema = new Schema({
    userid: { type: String, required: true},
    name: { type: String, required: true},
    username: { type: String, required: true},
    xp: { type: Number, required: true},
    gamesplayed: { type: Number, required: true},
    gameswon: { type: Number, required: true},
    gametime: { type: String, required: true},
    country: { type: String, required: true}
}, { timestamps: true });

// Setup model
const Player = mongoose.model('users', playerSchema);

// Export the model
module.exports = Player;