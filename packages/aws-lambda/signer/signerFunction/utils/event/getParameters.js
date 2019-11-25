module.exports = (event) => {
    const body = event.body ? JSON.parse(event.body) : {};

    const {
        apiKey,
        networkId: networkIdStr,
    } = event.pathParameters || {};
    const path = {
        apiKey,
        networkId: parseInt(networkIdStr, 10),
    }
    return {
        body,
        path,
    };
};
