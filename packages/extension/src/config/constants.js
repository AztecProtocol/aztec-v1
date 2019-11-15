import ACE from '../../build/contracts/ACE.json';

// exluding 0x
export const ADDRESS_LENGTH = 40;

export const USER_PUBLIC_KEY_LENGTH = 66;
export const EXTENSION_PUBLIC_KEY_LENGTH = 64;

export const REAL_VIEWING_KEY_LENGTH = 138;
export const VIEWING_KEY_LENGTH = 420;

export const METADATA_AZTEC_DATA_LENGTH = 194;
export const AZTEC_JS_METADATA_PREFIX_LENGTH = 130;

export const DYNAMIC_VAR_CONFIG_LENGTH = 64;
export const MIN_BYTES_VAR_LENGTH = 64;

export const START_EVENTS_SYNCING_BLOCK = 0;

export const INFURA_API_KEY = '09c4eed231c840d5ace14ba5389a1a7c';

export const NOTE_STATUS = {
    CREATED: 'CREATED',
    DESTROYED: 'DESTROYED',
};

export const SIGNING_PROVIDER = 'https://bv9t4hwozi.execute-api.us-east-1.amazonaws.com';

export const GANACHE_NETWORK_ID = Object.keys(ACE.networks).pop();

export const NETWORKS = {
    GANACHE: {
        id: GANACHE_NETWORK_ID,
        networkName: 'ganache',
    },
    MAIN: {
        id: 1,
        networkName: 'mainnet',
    },
    ROPSTEN: {
        id: 3,
        networkName: 'ropsten',
    },
    RINKEBY: {
        id: 4,
        networkName: 'rinkeby',
    },
    GOERLI: {
        id: 5,
        networkName: 'goerli',
    },
    KOVAN: {
        id: 42,
        networkName: 'kovan',
    },
};

export const INFURA_NETWORKS = [1, 3, 4, 5, 42];

export const NETWORKS_NAMES = (networkId) => {
    switch (parseInt(networkId, 10)) {
        case 1:
            return 'mainnet';
        case 3:
            return 'ropsten';
        case 4:
            return 'rinkeby';
        case 5:
            return 'goerli';
        case 42:
            return 'goerli';
        case GANACHE_NETWORK_ID:
            return 'ganache';
        default:
            return null;
    }
};
