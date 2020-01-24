const {
    types: { Dapps },
} = require('../../database/models');
const { log, errorLog } = require('../../utils/log');

module.exports = async ({ origin, apiKey }) => {
    log(`ORIGIN: ${origin}`);
    if (!origin) {
        return false;
    }

    try {
        const data = await Dapps.findOne({
            where: {
                apiKey,
            },
        });

        const { origin: resultOrigin, isEnabled } = data || {};
        return isEnabled && origin.includes(resultOrigin);
    } catch (e) {
        errorLog('isAPIKeyValid error', e);
        return false;
    }
};
