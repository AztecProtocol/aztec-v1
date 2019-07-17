import {
    METADATA_AZTEC_DATA_LENGTH,
    METADATA_VAR_LEN_LENGTH,
} from './constants';

export default [
    {
        name: 'aztecData',
        length: METADATA_AZTEC_DATA_LENGTH,
    },
    {
        name: 'addressesLength',
        length: METADATA_VAR_LEN_LENGTH,
    },
    {
        name: 'viewingKeysLength',
        length: METADATA_VAR_LEN_LENGTH,
    },
    {
        name: 'appDataLength',
        length: METADATA_VAR_LEN_LENGTH,
    },
    {
        name: 'addresses',
        length: 'addressesLength',
    },
    {
        name: 'viewingKeys',
        length: 'viewingKeysLength',
    },
    {
        name: 'appData',
        length: 'appDataLength',
    },
];
