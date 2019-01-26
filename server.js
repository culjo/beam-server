// "start": "node server.js"
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')
const routes = require('./routes/routes')

const {Products, Users} = require('./sequelize')

const port = 3002;
const app = express(); // init express

var corsOptions = {
    origin: 'http://example.com',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}

// Middleware for cors
app.use(cors())
// Middleware for bodyparsing using both json and url encoding
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Now to the endpoint
routes(app);



const server = app.listen(port, (error) => {
    if (error) return console.log('Error', error);
    console.log('Server is working and listening on port ', server.address().port);
})
