/*
 * middleware.js
 *
 * module.exports = a function (vs an object), because we can have other files pass in
 * configuration data.  In our case, we need to pass in the database.
 *
 * Middleware is a little different in Express. Not only does it get passed the req and res,
 * it gets a 3rd argument called next.
 *
 * Middleware runs before your regular route handler, so without next the private code will
 * never run.
*/

var cryptojs = require('crypto-js');

module.exports = function (db) {
    
    // return object defining middleware we need in our app
    return {
        // check for token, decrypt token and get user id and type
        requireAuthentication: function (req, res, next) {
            var token = req.get('Auth') || '';  // if .req fails, set token to empty string
            
            // disable requests unless tokens are saved in database
            db.token.findOne({        // first, look for hashed token in database
                where: {
                    tokenHash: cryptojs.MD5(token).toString()
                }
            }).then(function (tokenInstance) {  // if found...
                if (!tokenInstance) {
                    throw new Error();
                }
                
                req.token = tokenInstance;  // ... store it on the req object
                return db.user.findByToken(token);  // keep promise chain going...     
            }).then(function (user) {
                req.user = user;      // if that goes well, set user object on req object
                next();               // next() continues execution.
            }).catch(function () {
                res.status(401).send();
            });
        }
    };
    
};