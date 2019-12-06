const connect = require('./utils/connect');
const close = require('./utils/close');
const migrate = require('./utils/migrate');
const dbFactory = require('./helpers/dbFactory');
const {
    createDatabases,
} = require('./helpers');


module.exports = {
    dbFactory,
    connect,
    close,
    migrate,
    createDatabases,
};
