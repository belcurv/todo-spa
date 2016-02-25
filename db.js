/*
 * /db.js
 *
 * Purpose: 
 *   Return database connection to server.js upon request.
 *
 * If Node environment variable is production, we use Postgres.
 * Otherwise we use SQLite
 *
 * Call belonsTo and hasMany sequelize methods
*/

var Sequelize = require('sequelize'),
    env = process.env.NODE_ENV || 'development',
    sequelize;

// =========================== CHECK ENV ===========================
// If running on Heroku, use Postgres, else use SQLite.
if (env === 'production') {     
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        'dialect': 'postgres'
    });
} else {
    sequelize = new Sequelize(undefined, undefined, undefined, {
        'dialect': 'sqlite',
        'storage': __dirname + '/data/dev-todo-api.sqlite'
    });
}

// ==== create empty object to receive model
var db = {};

// .import method lets us load in sequalize models from separate files
db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.token = sequelize.import(__dirname + '/models/token.js');
db.sequelize = sequelize;           // add our sequelize instance to the object
db.Sequelize = Sequelize;           // add Sequelize library to the object

db.todo.belongsTo(db.user);         // sequelize association method
db.user.hasMany(db.todo);           // sequelize association method

module.exports = db;                // export the whole object