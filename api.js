//API Module
const express = require('express')
const api = express.Router();
const sqlite3 = require('sqlite3').verbose(); //Sqlite 

api.use(express.json()) //Handle POST form data 

//Load database
const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
})


//Verify API KEY on each request
function verifyKey(req, res, next) {
    if (req.body.api_key != process.env.API_KEY) {
        return res.send(JSON.stringify({result: "Invalid Key"})); //Error
    } 
    next()
};


//--- API Description ---
api.get('/', (req, res) => {
    res.set('Content-Type', 'text/plain')
    return res.send(`
Endpoints: 

- POST /api/log
    Params: cardUUID str, doorID int, alarm int, api_key string
    Description: Add new door log

- POST /api/new_user
    Params: cardUUID str, doorID int, name string
    Description: Add new customer
    
- GET /api/get_user
    Params: cardUUID str, doorID int, api_key string
    Description: Check if user is auth, return customer name
    `); //API Description
})


//--- Add new user ---
api.post('/new_user', verifyKey, (req, res) => {
    let cardUUID = req.body.cardUUID
    let doorID = req.body.doorID
    let name = req.body.name

    if (doorID <= 0){
        return res.send(JSON.stringify({result: "Error! DoorID must be greater than 0"})); //Error
    }

    db.run("INSERT INTO Customers (cardUUID, doorID, name) VALUES (?, ?, ?)", [cardUUID, doorID, name], (err, row) => {
        if (err) {
            return res.send(JSON.stringify({result: "Error"})); //Error
        } else {
            return res.send(JSON.stringify({result: "Success"})); //Success
        }
    });

})


//--- Add new log ---
api.post('/log', verifyKey, (req, res) => {

    let cardUUID = req.body.cardUUID
    let doorID = req.body.doorID
    let alarm = req.body.alarm

    //Check if customer is authorized
    db.get("SELECT cardUUID FROM Customers WHERE cardUUID = ? AND doorID = ?", [cardUUID, doorID], (err, row) => {
        if (row == null) {
            return res.send(JSON.stringify({result: "Bad access"})); //Unauthorized
        }
        else {
            //Insert new log
            db.run("INSERT INTO Accesses (carduuid, alarm) VALUES (?, ?)", [cardUUID, alarm], (err, row) => {
                if (err) {
                    return res.send(JSON.stringify({result: "Error"})); //Error
                } else {
                    return res.send(JSON.stringify({result: "Success"})); //Success
                }
            });
        }
    });
})


//--- Check auth ---
api.get('/get_user', verifyKey, (req, res) => {
    let cardUUID = req.body.cardUUID
    let doorID = req.body.doorID
    
    //Select customer name matching cardID and doorID
    db.get("SELECT name FROM Customers WHERE cardUUID = ? AND doorID = ?", [cardUUID, doorID], (err, row) => {
        if (row == null) {
            return res.send(JSON.stringify({result: "Bad access"})); //Error
        }
        else {
            return res.send(JSON.stringify({result: "Success", name: row.name})); //Success, return username
        }
    });
})

module.exports = api;