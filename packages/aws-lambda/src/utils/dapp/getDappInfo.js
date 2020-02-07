const {
    types: { Dapps },
} = require('../../database/models');

module.exports = async ({ apiKey }) => {
    return Dapps.findOne({
        where: {
            apiKey,
        },
    });
};
