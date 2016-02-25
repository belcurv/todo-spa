var express    = require('express'),
    bodyParser = require('body-parser'),
    morgan     = require('morgan'),
    _          = require('underscore'),
    db         = require('./db.js'),
    bcrypt     = require('bcrypt'),
    middleware = require('./middleware.js')(db),  // get middleware, pass in database
    app        = express(),
    port       = process.env.PORT || 3000,
    todos      = [],
    todoNextId = 1;            // not secure, we'll do this better later w/db

app.use(bodyParser.json());
app.use(morgan('dev'));

app.get('/', function (req, res) {
    res.send('Todo API root');
  
});

// ================= GET -> /todos ==================
// Gets all todos
app.get('/todos', middleware.requireAuthentication, function (req, res) {
    var query = req.query,     // returns an object!
        where = {
            userId: req.user.get('id')
        };
    
    // if completed exists & true, set where.compelted to true
    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true;
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false;
    }
    
    // if a URL query, & if query.length > zero.
    if (query.hasOwnProperty('q') && query.q.length > 0) {
        // filter on 'q'
        where.description = {
            $like: '%' + query.q + '%'
        };
    }
    
    // finally send the todos back res.json(todos)
    db.todo.findAll({
        where: where
    })
        .then(function (todos) {
            res.json(todos);
        }, function (err) {        // for error, send back 500 like before
            res.status(500).send();
        });

});


// ================ GET -> /todos/:id ================
// Gets a single todo based on ID
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10); // req.params returns a string; we need number
    
    // switch to findOne
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
        if (!!todo) {                   // double !! converts object to its 'truthy' boolean
            res.json(todo.toJSON());
        } else {
            res.status(404).send();
        }
    }, function (err) {
        res.status(500).send();
    });
    
});


// ================= POST -> /todos =================
// Adds a todo
app.post('/todos', middleware.requireAuthentication, function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    
    // call .create on db.todo
    db.todo.create(body).then(function (todo) {
        // create association, update todo item, return new todo item to API call.
        // middleware.js sets a user on the request object: req.user = user
        // so we have access to that here.
        req.user.addTodo(todo).then(function () {
            // .reload because we've added an association since todo has created
            return todo.reload();
        }).then(function (todo) {  // receives updated version of the todo
            res.json(todo.toJSON());
        });
    }, function (err) {
        res.status(400).json(err);         // error
    });

});


// =============== DELETE -> /todos/:id ===============
// Deletes a todo based on ID
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.destroy({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (rowsDeleted) {  // destroy returns number of deleted rows
        if (rowsDeleted === 0) {
            res.status(404).json({
                error: 'No todo with id'
            });
        } else {
            res.status(204).send();   // 204 = "all good, nothing to send back"
        }
    }, function () {
        res.status(500).send();
    });

});


// ================ PUT -> /todos/:id ================
// Update a todo based on ID
app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var body = _.pick(req.body, 'description', 'completed'),
        attributes = {},
        todoId = parseInt(req.params.id, 10);
    
    // check if 'completed' property exists
    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }
  
    // check if 'description' exists
    if (body.hasOwnProperty('description')) {
        // set body.description to be trimmed value
        attributes.description = body.description;
    }
    
    // change findOne with where clause where id = todoId && userId = req.user.get('id')
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (todo) {   // function fires if
        if (todo) {                                   // findById went well.
            todo.update(attributes).then(function (todo) {
                // function fires if todo.update went well
                res.json(todo.toJSON());
            }, function (err) {
                // function fires if todo.update went wrong
                res.status(400).json(err);            // 400 = 'invalid syntax'
            });
        } else {
            res.status(404).send();
        }
    }, function () {                // function fires if findById went wrong
        res.status(500).send();
    });

});


// ================= POST -> /users =================
// Add a user
app.post('/users', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    
    // call .create on db.todo
    db.user.create(body).then(function (user) {
        res.json(user.toPublicJSON());          // success
    }, function (err) {
        res.status(400).json(err);        // error
    });
});


// =============== POST -> /users/login ==============
// User login
app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password'),
        userInstance;
    
    // authentication via custom sequelize Class Method
    // on success, returns a token in header
    db.user.authenticate(body).then(function (user) {
        var token = user.generateToken('authentication');
        userInstance = user;
        
        return db.token.create({
            token: token
        });

    }).then(function (tokenInstance) {
        res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
    }).catch(function () {      // no user-friendly error messages in authentication!
        res.status(401).send();
    });
    
});


// ============== DELETE -> /users/login =============
// Delete login instance from database
app.delete('/users/login', middleware.requireAuthentication, function (req, res) {
    req.token.destroy().then(function () {
        res.status(204).send();
    }).catch(function () {
        res.status(500).send();
    })
});


// ================== START SERVER ===================
db.sequelize.sync({ force: true }).then(function () {
    app.listen(port, function () {
        console.log('Server listening on port ' + port);
    });
});