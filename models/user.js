var bcrypt   = require('bcrypt'),
    _        = require('underscore'),
    cryptojs = require('crypto-js'),
    jwt      = require('jsonwebtoken');

module.exports = function (sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,   // makes sure no other user record has this value
            validate: {
                isEmail: true   // email validation built into sequelize
            }
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,   // virtual not stored but IS accessible
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function (value) {
                var salt = bcrypt.genSaltSync(10),
                    hashedPassword = bcrypt.hashSync(value, salt);
                
                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
            }
        }
    }, {
        hooks: {        // see docs.sequelizejs.com
            beforeValidate: function (user, options) {
                // convert user.email to all-lowercase before validation
                // to avoid dupe emails because of capitalization.
                if (typeof user.email === 'string') {
                    user.email = user.email.toLowerCase();
                }
            }
        },
        classMethods: {
            authenticate: function (body) {
                return new Promise(function (resolve, reject) {
                    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
                        return reject();
                    }
                    
                    user.findOne({
                        where: {
                            email: body.email
                        }
                    }).then(function (user) {
                        if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
                            return reject();
                        }
                        
                        // finally, if things went well we resolve
                        resolve(user);
                    
                    }, function (err) {
                        reject();
                    });
                });
            },
            findByToken: function (token) {
                return new Promise(function (resolve, reject) {
                    // decode token and decrypt our data
                    try {
                        // .verify method confirms token validity and fidelity.
                        // It takes the token and the jwt password from generateToken.
                        var decodedJWT = jwt.verify(token, 'qwerty098'),
                            bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#!'),
                            tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
                        
                        user.findById(tokenData.id).then(function (user) {
                            if (user) {
                                resolve(user);
                            } else {
                                reject();  // reject if ID not found in database
                            }
                        }, function (err) {
                            reject();  // reject if findById fails b/c maybe no db connection
                        });
                        
                        
                    } catch (err) {
                        reject();      // reject if token isn't a valid format
                    }
                });
            }
        },
        instanceMethods: {
            toPublicJSON: function () {
                // only return our public properties
                var json = this.toJSON();
                return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
            },
            generateToken: function (type) {
                // if type doesn't exist
                if (!_.isString(type)) {
                    return undefined;
                }

                // if everything goes well, try & catch
                try {
                    var stringData = JSON.stringify({ id: this.get('id'), type: type }),
                        encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#!').toString(),
                        token = jwt.sign({             // jwt.sign takes 2 arguments:
                            token: encryptedData       // the body
                        }, 'qwerty098');               // the jwt password

                    return token;
                } catch (err) {
                    console.error(err);
                    return undefined;
                }
            }
        }
    });
    
    return user;
};