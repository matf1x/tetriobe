// Export
// Create the exports
module.exports = {

    // Create a JSON output
    createOutput: (status, data, error, msg) => {

        // Check for errors
        return {
            success: status,
            error: {
                status: error,
                msg: msg
            },
            data
        }

    }

}