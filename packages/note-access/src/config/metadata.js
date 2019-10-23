import {
    METADATA_AZTEC_DATA_LENGTH,
    DYNAMIC_VAR_CONFIG_LENGTH,
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
} from './constants';

export default [
    {
        name: 'aztecData',
        length: METADATA_AZTEC_DATA_LENGTH,
    },
    {
        name: 'addressesOffset',
        length: DYNAMIC_VAR_CONFIG_LENGTH,
    },
    {
        name: 'viewingKeysOffset',
        length: DYNAMIC_VAR_CONFIG_LENGTH,
    },
    {
        name: 'appDataOffset',
        length: DYNAMIC_VAR_CONFIG_LENGTH,
    },
    {
        name: 'addresses',
        length: ADDRESS_LENGTH,
        startAt: 'addressesOffset',
    },
    {
        name: 'viewingKeys',
        length: VIEWING_KEY_LENGTH,
        startAt: 'viewingKeysOffset',
    },
    {
        name: 'appData',
        startAt: 'appDataOffset',
    },
];
