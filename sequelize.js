
const Sequelize = require('sequelize')
const ProductModel = require('./models/product')
const UserModel = require('./models/user')
const UserProductsModel = require('./models/user_products')

const sequelize = new Sequelize('beam', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
})

sequelize.authenticate().then(() => {
    console.log('DB Connection has been extablished');
}).catch(err => {
    console.error('Unable to connecto to the database');
})

const Users = UserModel(sequelize)
const Products = ProductModel(sequelize) // , Sequelize)
const UserProducts = UserProductsModel(sequelize, Users, Products)

// UserProducts.belongsTo(Users)
UserProducts.belongsTo(Products, {foreignKey: 'product_id'})

module.exports = {
    Users,
    Products,
    UserProducts
}
