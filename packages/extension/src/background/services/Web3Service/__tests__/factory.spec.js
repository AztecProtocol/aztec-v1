import Web3ServiceFactory from '../factory';
import Web3Service from '..';

describe('Web3ServiceFactory', () => {
    const configs = [
        {
            title: 'best network',
            networkId: 5,
            providerUrl: 'https://best-url.ever',
        },
        {
            title: 'best network 2',
            networkId: 6,
            providerUrl: 'https://best-url2.ever',
        },
    ];

    beforeEach(() => {
        Web3ServiceFactory.setConfigs([]);
    });

    it('should set networks configs', () => {
        // given
        const networksConfigsBefore = Web3ServiceFactory.getConfigs();
        expect(networksConfigsBefore).toEqual({});

        // action
        Web3ServiceFactory.setConfigs(configs);

        // expected
        const expectedResult = {
            5: configs[0],
            6: configs[1],
        };
        const networksConfigsAfter = Web3ServiceFactory.getConfigs();
        expect(networksConfigsAfter).toEqual(expectedResult);
    });

    it('should not set config without title in network config', () => {
        // given
        const networksConfigsBefore = Web3ServiceFactory.getConfigs();
        expect(networksConfigsBefore).toEqual({});

        const notRightConfigs = [
            {
                title: 'best network',
                networkId: 5,
                providerUrl: 'https://best-url.ever',
            },
            {
                networkId: 6,
                providerUrl: 'https://best-url2.ever',
            },
        ];

        // action
        Web3ServiceFactory.setConfigs(notRightConfigs);

        // expected
        const expectedResult = {};
        const networksConfigsAfter = Web3ServiceFactory.getConfigs();
        expect(networksConfigsAfter).toEqual(expectedResult);
    });

    it('should not set config without networkId in network config', () => {
        // given
        const networksConfigsBefore = Web3ServiceFactory.getConfigs();
        expect(networksConfigsBefore).toEqual({});

        const notRightConfigs = [
            {
                title: 'best network',
                providerUrl: 'https://best-url.ever',
            },
            {
                title: 'ropsten',
                networkId: 6,
                providerUrl: 'https://best-url2.ever',
            },
        ];

        // action
        Web3ServiceFactory.setConfigs(notRightConfigs);

        // expected
        const expectedResult = {};
        const networksConfigsAfter = Web3ServiceFactory.getConfigs();
        expect(networksConfigsAfter).toEqual(expectedResult);
    });

    it('should not set config without providerUrl in network config', () => {
        // given
        const networksConfigsBefore = Web3ServiceFactory.getConfigs();
        expect(networksConfigsBefore).toEqual({});

        const notRightConfigs = [
            {
                title: 'best network',
                networkId: 4,
            },
            {
                title: 'ropsten',
                networkId: 6,
                providerUrl: 'https://best-url2.ever',
            },
        ];

        // action
        Web3ServiceFactory.setConfigs(notRightConfigs);

        // expected
        const expectedResult = {};
        const networksConfigsAfter = Web3ServiceFactory.getConfigs();
        expect(networksConfigsAfter).toEqual(expectedResult);
    });

    it('should create Web3Service with right configs', () => {
        // given
        Web3ServiceFactory.setConfigs(configs);
        const networkConfig = configs[0];

        // action
        const web3Service = Web3ServiceFactory.create(networkConfig.networkId);

        // expected
        expect(web3Service).toBeDefined();
        expect(web3Service.web3.currentProvider.host).toEqual(networkConfig.providerUrl);
    });

    it('should take Web3Service from chache', () => {
        // given
        Web3ServiceFactory.setConfigs(configs);
        const networkConfig = configs[0];
        const networkConfig_2 = configs[1];

        // action
        const web3Service = Web3ServiceFactory.create(networkConfig.networkId);
        const web3Service_2 = Web3ServiceFactory.create(networkConfig_2.networkId);
        web3Service.someAddFunc = (a, b) => a + b;

        // expected
        const web3ServiceRetrieved = Web3ServiceFactory.create(networkConfig.networkId);
        expect(web3ServiceRetrieved).toBeDefined();
        expect(web3ServiceRetrieved.someAddFunc(1, 1)).toEqual(2);
        expect(web3Service_2.someAddFunc).toBeUndefined();
    });

    it('should create new Web3Service', () => {
        // given
        Web3ServiceFactory.setConfigs(configs);
        const networkConfig = configs[0];

        // action
        const service = Web3Service(networkConfig.networkId);

        // expect
        expect(service).toBeDefined();
    });
});
