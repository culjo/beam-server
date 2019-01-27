// "start": "node server.js"
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')
const routes = require('./routes/routes')
const firebaseAdmin = require('firebase-admin')
const firebaseServiceAccount = require('./fcm/beam-8b134-firebase-adminsdk-49six-31dfafc9c6.json')
const CronJob = require('cron').CronJob

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

// Firebase Admin Setup
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
})


// set up the cron job
console.log('Before Cron Job Init')
const job = new CronJob('5 0 * * * *', () => {
    // console.log('I am running every 5 secs')
    const d = new Date();
    console.log('My on Tick Date is', d);
    
}, () => {
    console.log('Stopped The cron Job...')
});


app.get('/promos/start', (request, response) => {
    console.log('After Cron Job Init')
    job.start();
    // console.log('Next Dates for the Cron Jobs', job.nextDates(5))
    response.json({promo_status: "started"})
})

app.get('/promos/stop', (request, response) => {
    console.log('Cron Last Execution date', job.lastDate())
    job.stop()
    response.json({promo_status: "stoped"})
})

app.get('/test/fcm', (request, response) => {
    firebaseAdmin.messaging().send({
        notification: {
            title: 'Hello Beam Node',
            body: 'From Node Admin SDK '
        },
        data: {
            price: '23,00',
            products: 'Product Name'
        },
        token: 'dkIafdCPCsw:APA91bGGCSgqGhB9GGfKeG69b0K_YtJ9D2nf27Pk7-D87Wvx07SAzTf4_jZEqgzNzKuyG9cHDEaY6OaRtvVXBpmVg5tbhAO0zY0K87oDmKlZcn8utV20PjyKCqCXmAj5m7dgzma-saxb',
    }).then(result => {
        console.log('Successfully sent Firebase Message', result);
    }).catch(error => {
        console.log('Error Sedning Firebase Message', error);
    })
})


const server = app.listen(port, (error) => {
    if (error) return console.log('Error', error);
    console.log('Server is working and listening on port ', server.address().port);
})
