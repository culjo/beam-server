
const Seqeulize = require('sequelize')
const Op = Seqeulize.Op

const { Products, Users, UserProducts } = require('../sequelize')

/*const users = [{
    id: 1,
    name: "Richard Hendricks",
    email: "richard@piedpiper.com",
},
{
    id: 2,
    name: "Bertram Gilfoyle",
    email: "gilfoyle@piedpiper.com",
}];*/

// TODO: Specify Controllers for Users, Products, UserProducts
const router = app => {

    app.get('/', (request, response) => {
        console.log('URL: ', request.url);
        response.send({ message: 'Hello, Object Json' });
    });

    /**
     * Create a new user, mostly used when a user has downloaded the app an opened it
     */
    app.post('/users', (request, response) => {
        var body = request.body;

        if (Object.keys(body).length > 0 && body.constructor === Object) {

            if (body.uniqueId && body.deviceToken && body.name && body.location) {

                Users.create({
                    unique_id: body.uniqueId,
                    device_fcm_token: body.deviceToken,
                    name: body.name,
                    location: body.location
                }).then(user => {
                    responseSuccess(response, user, 'User Created', 201);
                }).catch(err => {
                    responseFailure(response, 'Failed to create User', err.toString)
                })

            } else {
                responseFailure(response, 'Please provide user identification, device token, user name & user location')
            }

        } else {
            responseFailure(response, 'Please Provide User Information')
        }
        
    })

    app.get('/users', (request, response) => {

        Users.findAll().then(users => response.json(users))
        // response.send(users);
    });

    app.get('/users/:id/products', (request, response) => {

        UserProducts.findAll({
            include: [{
                model: Products,
                where: {
                    product_id: Seqeulize.col('product.product_id')
                }
            }]
        }).then(userProducts => response.json(userProducts))
        .catch(err => responseFailure(response, "******* " + err));
    })

    app.get('/products', (request, response) => {
        console.log('Query Params is', request.query);

        var offset = 0, limit = 18;
        if (request.query.limit != undefined) {
            limit = parseInt(request.query.limit);
        }
        if (request.query.offset) {
            offset = parseInt(request.query.offset);
        }
        Products.findAll({ offset: offset, limit: limit })
            .then(product => response.json(product))
            .catch(err => responseFailure(response, err + ""))
    })

    app.get('/products/:id', (request, response) => {
        var id = request.params['id']
        Products.findOne().then(product => response.json(product))
    })

    app.put('/products/:id', (request, response) => {

        var body = request.body;

        if (Object.keys(body).length === 0 && body.constructor === Object) {
            responseFailure(response, 'Please Provide Information', 'No values set for update')
        }


        Products.update(body, {
            where: {
                product_id: {
                    [Op.eq]: 1
                }
            }
        }).then(resultCount => {
            responseSuccess(response, {updated: resultCount}, 'Dope')
        }).catch(err => {
            responseFailure(response, 'Doom!', err.toString)
        })

    })


    /**
     * subtracts all the promo prices from product discount prices
     */
    app.put('/promos/products', (request, response) => {

        Products.decrement('discount', {
            by: Seqeulize.col('price_to_subtract'),
            where: {
                // product_id: 2,
                is_promo_enabled: true,
                stock_count: { [Op.gt] : 0 }
            }
        }).then(result => {
            // send notifications to all users aboout this new change..
            responseSuccess(response, result)
        }).catch(err => {
            responseFailure(response, 'Shit,,,,', err.toString)
        })
        /*Products.update({

        }, {
            where: {
                is_promo_enabled: true
            }
        } )*/

    })

    

    /**
     * Subscribe user to  a particular product
     */
    app.post('/products/:id/subscribe', (request, response) => {
        var productId = request.params['id']

        var body = request.body;
        if (body.userId) {
            UserProducts.create({
                user_id: body.userId,
                product_id: productId
            }).then(userProduct => {
                responseSuccess(response, userProduct, 'Subscribed Successfully', 201)
            }).catch(err => {
                responseFailure(response, "Oops! Failed to subscribe")
            })
        }
        
        //responseSuccess(response, { id: productId }, "Event Successful")
    })

    app.post('/subscribe', (request, response) => {
        console.log("Request Body PARAMS: ", request.body);
        var resObject = request.body;
    
        if (resObject.userId && reqObject.productId) {
            
        }
        response.json({done: true})
    })

    // app.post('/subscribe', (request, response) => {
        
    // })


}

const responseFailure = (res, message = '', errorMessage = '', statusCode = 400) => {
    res.status(statusCode).json({
        success: false,
        message: message,
        errorMessage: errorMessage
    });
};

const responseSuccess = (response, data, message = '', statusCode = 200) => {
    response.status(statusCode).json({
        success: true,
        message: message,
        data: data
    })
}

/*function isObjectEmpty(Obj) {
    for(var key in Obj) {
    if(Obj.hasOwnProperty(key))
    return false;
    }
    return true;    
}*/

// ECMA 7+
// Object.entries(obj).length === 0 && obj.constructor === Object
// ECMA 5+
// Object.keys(obj).length === 0 && obj.constructor === Object


module.exports = router;