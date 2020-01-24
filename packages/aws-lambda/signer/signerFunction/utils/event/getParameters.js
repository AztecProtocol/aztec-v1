const getOrigin = require('./getOrigin');

module.exports = (event) => {
    const body = event.body ? JSON.parse(event.body) : {};

    const { apiKey, networkId: networkIdStr } = event.pathParameters || {};
    const path = {
        apiKey,
        networkId: parseInt(networkIdStr, 10),
    };
    const headers = {
        origin: getOrigin(event),
    };
    return {
        body,
        path,
        headers,
    };
};
