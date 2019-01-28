
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
    app.post('/users/login', (request, response) => {
        var body = request.body;

        if (Object.keys(body).length > 0 && body.constructor === Object) {

            if (body.uniqueId && body.phone) { // && body.location) {

                Users.findOrCreate({
                    where: {
                        phone: body.phone
                    },
                    defaults: {
                        unique_id: body.uniqueId,
                        device_fcm_token: body.deviceToken != undefined ? body.deviceToken : '',
                        phone: body.phone,

                    }
                }).spread((user, created) => {
                    responseSuccess(response, user, 'User Created', 201);
                })
                /*.then(user => {
                    responseSuccess(response, user, 'User Created', 201);
                }).catch(err => {
                    responseFailure(response, 'Failed to create User', err.toString)
                })*/

            } else {
                responseFailure(response, 'Please provide user identification, device token and user phone')
            }

        } else {
            responseFailure(response, 'Please Provide User Information')
        }

    })

    /**
     * @deprecated
     * Create a new user, mostly used when a user has downloaded the app an opened it
     */
    app.post('/users', (request, response) => {
        var body = request.body;

        if (Object.keys(body).length > 0 && body.constructor === Object) {

            if (body.uniqueId && body.deviceToken && body.phone) { // && body.location) {

                Users.create({
                    unique_id: body.uniqueId,
                    device_fcm_token: body.deviceToken,
                    phone: body.phone,
                    // location: body.location
                }).then(user => {
                    responseSuccess(response, user, 'User Created', 201);
                }).catch(err => {
                    responseFailure(response, 'Failed to create User', err.toString())
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

        var userId = request.params.id
        
        UserProducts.findAll({
            include: [{
                model: Products,
                where: {
                    product_id: Seqeulize.col('product.product_id')
                }
            }],
            where: {
                user_id: parseInt(userId)
            }
        }).then(userProducts => responseSuccess(response, userProducts, 'Success'))  // response.json(userProducts))
            .catch(err => responseFailure(response, "******* " + err));
    })

    // ------------------------------------------------------------------------
    app.get('/users/:id/products/test', (request, response) => {

        // UserProducts.afterFind((userProduct, options) => {
            // console.log('Call to after Find', userProduct.length)
        // })

        UserProducts.findAll({
            include: [{
                model: Products,
                where: {
                    product_id: Seqeulize.col('product.product_id'),
                }
            }, {
                model: Users,
                where: {user_id: Seqeulize.col('user.user_id')}
            }],
            where: {
                my_price: { [Op.gte] : Seqeulize.col('product.discount')}
            }
        }
        ).then(userProducts => response.json(userProducts))
            .catch(err => responseFailure(response, "******* " + err));
    })


    app.get('/products', (request, response) => {
        console.log('Query Params is', request.query);

        var offset = 0, limit = 25;
        if (request.query.limit != undefined) {
            limit = parseInt(request.query.limit);
        }
        if (request.query.offset) {
            offset = parseInt(request.query.offset);
        }
        Products.findAll({ offset: offset, limit: limit })
            .then(products => {
                var payload = {
                    // page: 1,
                    start: offset,
                    per_page: limit,
                    total: products.length,
                    data: products
                }
                response.json(payload)
            })
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
            responseSuccess(response, { updated: resultCount }, 'Successful')
        }).catch(err => {
            responseFailure(response, 'Doom!', err.toString())
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
                stock_count: { [Op.gt]: 0 }
            }
        }).then(result => {
            // send notifications to all users aboout this new change..
            responseSuccess(response, result)
        }).catch(err => {
            responseFailure(response, 'Shit,,,,', err.toString())
        })
        /*Products.update({

        }, {
            where: {
                is_promo_enabled: true
            }
        } )*/

    })

    /**
     * Subscribe user to a particular product, if a user has been subscribed before we update his price
     * it can be also be to update the user prefered price for product
     */
    app.post('/products/:id/subscribe', (request, response) => { // from subscribe -> watch
        var productId = request.params['id']

        var body = request.body;
        if (body.userId && body.myPrice) {
            UserProducts.findOrCreate({
                where: {
                    product_id: productId,
                    user_id: body.userId
                },
                defaults: {
                    product_id: parseInt(productId),
                    user_id: body.userId,
                    my_price: body.myPrice
                }
            }).spread((userproduct, created) => {
                if (!created) { // That mean userProduct was not created
                    // Then Update the 
                    UserProducts.update({
                        my_price: body.myPrice
                    }, {
                            where: {
                                user_id: body.userId,
                                product_id: productId
                            }
                        })
                        .then(result => {
                            var o = userproduct;
                            o.my_price = body.myPrice
                            responseSuccess(response, o, 'Product subscribed updated successfully')
                        })
                        .catch(err => responseFailure(response, 'Failed to subscribe to product', err.toString()))
                } else {
                    responseSuccess(response, userproduct, 'Product subscribed to successfully')
                }
            })

            /*.then(userProduct => {
                    responseSuccess(response, userProduct, 'Subscribed Successfully', 201)
                }).catch(err => {
                    responseFailure(response, "Oops! Failed to subscribe")
                })*/

        } else {
            responseFailure(response, 'Please Set all nesscessary params', 'Error Subsribing user')
        }

        //responseSuccess(response, { id: productId }, "Event Successful")
    })

    /**
     * Unsubscribe user from a product watch
     */
    app.put('/products/:id/unsubscribe', (request, response) => {
        var productId = request.params.id
        var body = request.body
        if (body.userId) {
            UserProducts.update({
                disabled: true
            }, {
                    where: {
                        user_id: { [Op.eq]: body.userId },
                        product_id: { [Op.eq]: productId }
                    }
                }).then(done => responseSuccess(response, {}, 'Unsubscribed Successfully'))
                .catch(err => responseFailure(response, 'Failed to Unsubscribe', err))
        } else {
            responseFailure(response, 'Failed')
        }

    })

    /**
     * Save user device fcm generated token,
     * This token will be used to send push notification to user particular devices 
     */
    app.put('/save-token', (request, response) => {

        var body = request.body
        if (body.token && body.userId && body.uuid) {
            Users.update({
                device_fcm_token: body.token
            }, {
                    where: { user_id: { [Op.eq]: body.userId }, unique_id: { [Op.eq]: body.uuid } }
                }).then(resultCount => {
                    responseSuccess(response, { updated: resultCount }, 'Successful')
                }).catch(err => {
                    responseFailure(response, 'Failed to save user device token', err.toString())
                })

        } else {
            responseFailure(response, 'Please provide user device token & information ')
        }

    })


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