const http = require('http');
const mysql = require('mysql');
const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');

var app = express();

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = mysql.createPool({
    host: 'mysqldb.c3pg7tvyvrqq.us-east-1.rds.amazonaws.com',
    user: 'username',
    password: 'password',
    database: 'mysqldb',
    charset: 'utf8',
    port: '3306'
});


function setResHtml(sql, cb) {
    pool.getConnection((err, con) => {
        if (err) throw err;

        con.query(sql, (err, res, cols) => {
            if (err) throw err;

            return cb(res);
        });
    });
}

app.get('/', function(request, response) {
    response.redirect('/home');
});
app.get('/home', function(request, response) {
    response.render('./home.ejs');
});

app.get('/care_Signin', function(request, response) {
    response.render('./custcare.ejs', { stat: 1 });
});


app.post('/care_Signin', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    console.log(request.body);
    if (username && password) {
        pool.query('SELECT * FROM customercare WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/complaints');
            } else {

                console.log("WRONG PASSWORD/USERNAME");
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});
app.get('/user_signup', function(request, response) {
    response.render('./user_Signup.ejs', { stat: 1 });
});
app.post('/user_signup', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        pool.query('insert into user(username, password) values(?,?)', [username, password], function(error, results, fields) {
            response.redirect('/home');
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});


app.get('/user_signin', function(request, response) {
    response.render('./user_Signin.ejs', { stat: 1 });
});
app.post('/user_signin', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        pool.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {

            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/complain');
            } else {

                console.log("WRONG PASSWORD/USERNAME");
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.get('/data', isLoggedIn, function(req, res) {
    res.render('./data.ejs');
});

app.get('/complain', isLoggedIn, (req, res) => {
    res.render('./complain.ejs');
});
app.post('/complain', isLoggedIn, (req, res) => {
    var email = req.body.email;
    var complain = req.body.complain;
    pool.query('insert into complaints(email, complain) values(?,?)', [email, complain], function(error, results, fields) {
        if (error) console.log(error);
        res.render('./complain.ejs');
    });
})

app.get('/complaints', isLoggedIn, (req, res) => {
    setResHtml("select * from complaints", (responseData) => {
        res.render('./complaints.ejs', { data: responseData });
    });
});

app.get('/logout', isLoggedIn, (req, res) => {
    req.session.loggedin = false;
    res.redirect('/home');
});

function isLoggedIn(req, res, next) {
    if (req.session.loggedin) {
        return next();
    }
    res.send("Not Logged In");
}


app.listen(80, () => {
    console.log("Connected to 3000");
});