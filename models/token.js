/*
 * models/token.js
 *
 * Logging out is complicated becuase we're not tracking tokens.
 * If I want to log out it doesn't really matter.
 * By storing tokens in the db, we can log users out and delete the tokens
 *    from the db.
 *
 * Purpose: give us a sequelize model to store hashed tokens.
 * Never want to store security data unencrypted
*/

var cryptojs = require('crypto-js');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('token', {
        token: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [1]
            },
            set: function (value) {
                var hash = cryptojs.MD5(value).toString();
                
                this.setDataValue('token', value);
                this.setDataValue('tokenHash', hash);
            }
        },
        tokenHash: DataTypes.STRING
    });
};