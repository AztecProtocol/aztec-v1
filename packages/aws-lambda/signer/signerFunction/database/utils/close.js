const { connection } = require('../helpers');
const { log, errorLog } = require('../../utils/log');

module.exports = async () => {
    try {
        await connection.getConnection().close();
        log('Connection has been closed successfully.');
        return true;
    } catch (e) {
        errorLog('Unable to close connection:', e);
        return false;
    }
};
