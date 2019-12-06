const {
    dbFactory,
} = require('../../database');


module.exports = async ({
    apiKey,
    networkId,
}) => {
    const {
        Dapps,
    } = dbFactory.getDB(networkId);
    return Dapps.findOne({ where: {
        apiKey,
    } });
};
