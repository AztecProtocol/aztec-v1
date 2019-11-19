const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'postgres',
});

console.error(`TODO: pass db connection to process.env`);

module.exports = sequelize;



// // eslint-disable-next-line import/no-unresolved
// const AWS = require('aws-sdk');
// const {
//     AWS_REGION,
// } = require('../../../config/constants');

// AWS.config.update({
//     region: AWS_REGION,
// });

// module.exports = new AWS.DynamoDB.DocumentClient();