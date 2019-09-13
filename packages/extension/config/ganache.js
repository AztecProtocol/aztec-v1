export default {
    networks: {
        development: {
            host: '127.0.0.1',
            network_id: '*',
            port: 8545,
            numberOfAccounts: 10,
            defaultBalanceEther: 100,
        },
        test: {
            host: '127.0.0.1',
            network_id: '*',
            port: 8545,
            numberOfAccounts: 4,
            defaultBalanceEther: 100,
        },
    },
};
