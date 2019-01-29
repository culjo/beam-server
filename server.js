// "start": "node server.js"
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')
const Seqeulize = require('sequelize')
const routes = require('./routes/routes')
const firebaseAdmin = require('firebase-admin')
const firebaseServiceAccount = require('./fcm/beam-8b134-firebase-adminsdk-49six-31dfafc9c6.json')
const CronJob = require('cron').CronJob

const Op = Seqeulize.Op
const { Products, Users, UserProducts } = require('./sequelize')

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
app.use(bodyParser.urlencoded({ extended: true }));

// Now to the endpoint
routes(app);

// Firebase Admin Setup
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
})


// set up the cron job
console.log('Before Cron Job Init')
const job = new CronJob('5 * * * * *', () => {
    // console.log('I am running every 5 secs')
    // const d = new Date();
    console.log('Start Subtracting prices');

    subtractPromoPrices();

}, () => {
    console.log('Stopped The cron Job...')
});


app.get('/promos/start', (request, response) => {
    console.log('After Cron Job Init')
    job.start();
    // console.log('Next Dates for the Cron Jobs', job.nextDates(5))
    response.json({ promo_status: "started" })
})

app.get('/promos/stop', (request, response) => {
    console.log('Cron Last Execution date', job.lastDate())
    job.stop()
    response.json({ promo_status: "stoped" })
})


const subtractPromoPrices = () => {

    Products.decrement('discount', {
        by: Seqeulize.col('price_to_subtract'),
        where: {
            // product_id: 2,
            is_promo_enabled: true,
            stock_count: { [Op.gt]: 0 }
        }
    }).then(result => {

        // send notifications to all users aboout this new change..
        getPromoMatchingPrices();

    }).catch(err => {
        // responseFailure(response, 'Shit,,,,', err.toString())
    })

}

const userNotified = (uPId, userId) => {
    UserProducts.update({
        is_notified: true
    }, {
            where: {
                user_product_id: uPId,
                user_id: userId
            }
        }).then(result => {
            console.log('User Has been notified')
        })
        .catch(err => console.log('Failed to updated user notified column'))
}

const getPromoMatchingPrices = () => {
    UserProducts.findAll({
        include: [{
            model: Products,
            where: {
                product_id: Seqeulize.col('product.product_id'),
            }
        }, {
            model: Users,
            where: { user_id: Seqeulize.col('user.user_id') }
        }],
        where: {
            my_price: { [Op.gte]: Seqeulize.col('product.discount') },
            is_notified: false,
            disabled: false
        }
    }
    ).then(userProducts => {
        
        for (const userInfo of userProducts) {
            sendPushNotificationToUser(userInfo)
        }
            
        console.log('No User Available for notification', userProducts.length)

    })
        .catch(err => console.log('Operation Failed... Getting Price Matching users', err)) // responseFailure(response, "******* " + err));
}

const sendPushNotificationToUser = (userInfo) => {

    const productName = userInfo['product']['name']
    const discount = userInfo['product']['discount']
    const token = userInfo['user']['device_fcm_token']

    firebaseAdmin.messaging().send({
        notification: {
            title: productName,
            body: `Hurray!! Price is now ${discount}. Act fast before getting out of stock`
        },
        data: {
            price: userInfo['product']['price'],
            discount: discount,
            name: productName
        },
        token: token,
    }).then(result => {
        // update notified column 
        userNotified(userInfo['user_product_id'], userInfo['user']['user_id']);
        console.log('Successfully sent Firebase Message', result);
    }).catch(error => {
        console.log('Error Sedning Firebase Message', error);
    })

}


const server = app.listen(port, (error) => {
    if (error) return console.log('Error', error);
    console.log('Server is working and listening on port ', server.address().port);
})


/**
 * @deprecated - This was used for testing the push Notification
 */
/*app.get('/test/fcm', (request, response) => {
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
})*/