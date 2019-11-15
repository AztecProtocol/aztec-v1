const {
    Dapp,
} = require('../../database/models');


module.exports = async ({
    apiKey,
}) => {
    return Dapp.findOne({ where: {
        apiKey,
    } });
};
