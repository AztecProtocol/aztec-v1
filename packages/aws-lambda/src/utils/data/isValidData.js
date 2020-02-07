module.exports = (data) => {
    const fields = [
        'relayerAddress',
        'from',
        'encodedFunctionCall',
        'txFee',
        'gasPrice',
        'gas',
        'nonce',
        'relayHubAddress',
        'to',
    ];

    if (data === null || !(data instanceof Object)) {
        return false;
    }

    for (let i = 0; i < data.length; i += 1) {
        if (!data[fields[i]]) {
            return false;
        }
    }

    return true;
};
