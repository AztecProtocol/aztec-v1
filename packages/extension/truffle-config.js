module.exports = {
    compilers: {
        solc: {
            version: '0.5.4',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
                evmVersion: 'constantinople',
            },
        },
    },
    mocha: {
        bail: true,
        enableTimeouts: false,
        reporter: 'spec',
    },
    networks: {
        development: {
            host: '127.0.0.1',
            // provider,
            gas: 6500000,
            network_id: '*', // eslint-disable-line camelcase
            port: 8545,
        },
    },
};
