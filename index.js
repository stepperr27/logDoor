//Import libraries
const express = require('express'); //Web Engine
const cookieSession = require('cookie-session')
const sqlite3 = require('sqlite3').verbose(); //Sqlite
const MD5 = require("crypto-js/md5");
const {v4 : uuidv4} = require('uuid');


//Init application
const app = express();
const port = 3000;
app.set('view engine', 'ejs'); //EJS View engine
app.use('/api', require('./api')); //API Endpoint
app.use(express.urlencoded({ extended: true })) //Handle POST form data
app.use(express.static('public')) //Public directory
app.use(cookieSession({
    name: 'session',
    sameSite: 'lax',
    keys: [uuidv4()],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


//Load database
const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
})


//--- Routes ---
//Main
app.get('/', (req, res) => {
    res.render('main'); //Home
})

//Admin
app.get('/admin', (req, res) => {
    res.render('admin', {error: false}); //Admin login page
})

//Handle admin login
app.post('/admin', (req, res) => {
    let sql_query = "SELECT username FROM Users WHERE username = ? AND password = ?";
    //Select user id with username and hashed password (MD5)
    db.get(sql_query, [req.body.username, MD5(req.body.password).toString()], (err, row) => {
        if (row == null) {
            return res.render('admin', {error: true}); //Failed
        }
        else {
            req.session.user = row.username
            return res.redirect('/dashboard'); //Successful
        }
    });
})

//Dashboard
app.get('/dashboard', (req, res) => {

    //Check auth
    if (req.session.user == null){
        return res.redirect('/admin');
    }

    let sql_query_logs = `SELECT
                    Accesses.cardUUID,
                    Customers.doorID,
                    Customers.name,
                    strftime('%d/%m/%Y, %H:%M',
                    datetime(Accesses.opening_time, 'unixepoch')) as opening_time,
                    Accesses.alarm FROM Accesses
                    INNER JOIN Customers ON Customers.cardUUID=Accesses.cardUUID
                    ORDER BY Accesses.opening_time DESC`;

    //List logs
    db.all(sql_query_logs, [], (err, logs_rows) => {
        if (err){
            return console.error(err.message);
        }
        else {
            //Get users
            var users_rows = logs_rows.reduce((accumulator, item) => {
                if (!accumulator.some( n => {return n.name == item.name;} )) {
                  accumulator.push({name: item.name, doorID: item.doorID, count: 1});
                } else {
                    //Filter users
                    var i = accumulator.findIndex(n => {return n.name == item.name});
                    accumulator[i].count += 1;
                }
                return accumulator;
              }, []);

            res.render('dashboard', {res_logs: logs_rows, res_users: users_rows}); //Admin login page
        }
    });

})


//Listen
app.listen(port, () => {
  console.log(`logDoor listening on: ${port}`)
})
