// exluding 0x
export const ADDRESS_LENGTH = 40;

export const USER_PUBLIC_KEY_LENGTH = 66;
export const EXTENSION_PUBLIC_KEY_LENGTH = 64;

export const REAL_VIEWING_KEY_LENGTH = 138;
export const VIEWING_KEY_LENGTH = 634;

export const METADATA_AZTEC_DATA_LENGTH = 194;
export const AZTEC_JS_METADATA_PREFIX_LENGTH = 130;

export const DYNAMIC_VAR_CONFIG_LENGTH = 64;
export const MIN_BYTES_VAR_LENGTH = 64;

export const START_EVENTS_SYNCING_BLOCK = 0;

export const NOTE_STATUS = {
    CREATED: 'CREATED',
    DESTROYED: 'DESTROYED',
};

export const NETWORKS = {
    GANACHE: {
        id: 0,
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
