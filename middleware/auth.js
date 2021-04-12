module.exports = (req, res, next) => {
  try {
    // Check if we received a token
    if (!req.headers.authorization) {
        return res.status(401).json({
            ok: false,
            error: 'No authentication token was found'
        });
    }

    // Get the token & split the token (Bearer xxxxxxxxx)
    const token = req.headers.authorization.split(' ')[1];

    // Check if the received token is valid
    if(token !== process.env.LOCAL_JWT_KEY) {
        return  res.status(401).json({
            ok: false,
            error: 'An invalid JWT token was found'
        });
    }

    // Otherwise, let's go to the next step
    next();
  } catch {
    res.status(401).json({
        ok: false,
        error: 'A unexpected error occured'
    });
  }
};