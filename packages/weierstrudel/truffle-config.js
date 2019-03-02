module.exports = {
    development: {
        host: '127.0.0.1',
        gas: 4700000,
        gasPrice: 1,
        network_id: '*', // eslint-disable-line camelcase
        port: 9545,
    },
    compilers: {
        external: {
            command: 'huff compile',
            targets: [{
                path: './build/huff_contracts/*',
            }],
        },
    },
    hardfork: 'constantinople',
};
