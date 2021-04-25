// Import other packages
const jsdom = require("jsdom");
require('dotenv').config();
require('jsdom-global')();

// Create JSDOM
const { JSDOM } = jsdom;

// Create the modules to export
module.exports = {

    /* -------------------------------------
     * Convert Output
     * This will convert the output we send to a more usable format
     * It will extract all the needed information we need for the process
     * ------------------------------------- */
    convertOutput: (output) => {
        // Create a new Promise
        return new Promise((resolve, reject) => {
            // Create a players map
            let plrs = [];

            // Get the data of the game
            const data = output.replace(/\\/g, '');
            const dom = new JSDOM(data);

            // Get all the players
            const players = dom.window.document.querySelectorAll("div.playerresult").forEach((node) => {
                
                // Get the innerHTML & JSDOM that
                const pdom = new JSDOM(node.innerHTML);

                // Get all the divs
                const player = pdom.window.document.querySelectorAll('div');

                // convert other lines
                const linesGet = new JSDOM(player[2].innerHTML);
                const linesSent = new JSDOM(player[4].innerHTML);

                // Get the correct info
                const user = {
                    place: player[0].innerHTML,
                    name: player[1].innerHTML.toLowerCase(),
                    points: module.exports.calculatePoints(player[0].innerHTML),
                    lines: {
                        get: linesGet.window.document.querySelector('span').innerHTML,
                        sent: linesSent.window.document.querySelector('span').innerHTML
                    }
                }

                // Add to the players list
                plrs.push(user);

            });

            // Resolve the info
            resolve(plrs);
        })
    },

    /* -------------------------------------
     * calculate Points
     * This will calculate the points based on the given place
     * ------------------------------------- */
    calculatePoints: (place) => {
        // Set a helper
        let points = 0;

        // Switch between the places
        switch(place) {
            case '1':
                points = 5;
                break;
            case '2':
                points = 4;
                break;
            case '3': 
                points = 3;
                break;
            case '4': 
                points = 2;
                break;
            case '5':
                points = 1;
                break;
        }

        // Return the total points
        return points;
    }

}