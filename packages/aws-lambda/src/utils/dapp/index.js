const isOriginBelongsToApiKeyValid = require('./isOriginBelongsToApiKeyValid');

console.log('balance');
const balance = require('./balance');
const getDappInfo = require('./getDappInfo');

module.exports = {
    balance,
    isOriginBelongsToApiKeyValid,
    getDappInfo,
};
