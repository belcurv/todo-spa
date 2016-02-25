/*
 * /models/todo.js
 *
 * Our database model, used by db.js.
 * The sequelize.import method inside db.js expects the specific format below:
 * a function taking 2 arguments: the sequelize instance ('sequelize') and data types
*/

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('todo', {
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 250],
                isString: function (value) {
                    if (typeof value !== 'string') {
                        throw new Error('Description must be a string');
                    }
                }
            }
        },
        completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            validate: {
                isBoolean: function (value) {
                    if (typeof value !== 'boolean') {
                        throw new Error('Completed must be a boolean');
                    }
                }
            }
        }
    });  
};