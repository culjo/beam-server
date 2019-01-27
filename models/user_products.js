const Sequelize = require('sequelize')

module.exports = (sequelize, Users, Products) => {
    return sequelize.define('user_products', {
        user_product_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            /*references: {
                model: Users,
                key: 'user_id'
            }*/
        },
        product_id: {
            type: Sequelize.INTEGER,
            /*references: {
                model: Products,
                key: 'product_id'
            }*/
        },
        my_price: Sequelize.DECIMAL,
        disabled: Sequelize.BOOLEAN,
    },
    {
        timestamps: true,
        createdAt: 'created_on',
        updatedAt: 'updated_on',
        underscored: true
    })
}