
const Sequelize = require('sequelize')

module.exports = (sequelize, type) => {
    return sequelize.define('products', {
        product_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.STRING,
        slug: Sequelize.STRING,
        price: Sequelize.DECIMAL,
        discount: Sequelize.DECIMAL,
        price_to_subtract: Sequelize.DECIMAL,
        stock_count: Sequelize.INTEGER,
        is_promo_enabled: Sequelize.BOOLEAN,
        category: Sequelize.STRING,
        manufacturer: Sequelize.STRING,
        image: Sequelize.STRING,
        description: Sequelize.TEXT,
        specifications: Sequelize.TEXT,
        tags: Sequelize.TEXT
    },
    {
        timestamps: true,
        createdAt: 'created_on',
        updatedAt: 'updated_on'
    }
    )
}