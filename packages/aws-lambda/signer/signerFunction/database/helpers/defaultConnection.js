const Sequelize = require('sequelize');
const {
    getConfig,
} = require('../config');


module.exports = () => {
    const {
        username,
        password,
        database,
        host,
        port,
        dialect,
    } = getConfig({
        database: 'postgres',
    });

    return new Sequelize(
        database,
        username,
        password,
        {
            host,
            port,
            dialect,
        },
    );
}