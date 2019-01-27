
const Sequelize = require('sequelize')

module.exports = (sequelize) => {

    return sequelize.define('users', {
        user_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        unique_id: Sequelize.INTEGER,
        device_fcm_token: Sequelize.STRING,
        name: Sequelize.STRING,
        phone: Sequelize.STRING,
        location: Sequelize.STRING,
        created_on: Sequelize.NOW

    },
    {
        timestamps: true,
        createdAt: 'created_on',
        updatedAt: 'updated_on'
    }
    )

}