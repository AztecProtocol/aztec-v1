const {
    dbFactory,
} = require('../../database');
const {
    log,
    errorLog,
} = require('../../utils/log');


module.exports = async ({
    origin,
    apiKey,
    networkId,
}) => {
    log(`ORIGIN: ${origin}`);
    const {
        Dapps,
    } = dbFactory.getDB(networkId);

    if(!origin) {
        return false;
    }

    try {
        const data = await Dapps.findOne({ where: {
            apiKey,
        } });

        const {
            origin: resultOrigin,
            isEnabled,
        } = data || {};
        return isEnabled && origin.includes(resultOrigin);
    } catch (e) {
        errorLog('isAPIKeyValid error', e);
        return false;
    }
};
