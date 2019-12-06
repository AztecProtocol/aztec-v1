const {
    log,
    errorLog,
} = require('../../utils/log');

module.exports = async (sequalize) => {
    try {
        await sequalize.authenticate();
        log('Connection has been established successfully.');
        return true;
    } catch (e) {
        errorLog('Unable to connect to the database:', e);
        return false;
    };
};
