const {
    log,
    errorLog,
} = require('../../utils/log');

module.exports = async (sequalize) => {
    try {
        await sequalize.close()
        log('Connection has been closed successfully.');
        return true;
    } catch (e) {
        errorLog('Unable to close connection:', e);
        return false;
    };
};
