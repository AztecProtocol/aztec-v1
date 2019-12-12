import { toChecksumAddress } from 'web3-utils';
import {
    METADATA_AZTEC_DATA_LENGTH,
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
} from './constants';

export const START_OFFSET = METADATA_AZTEC_DATA_LENGTH;

export default [
    {
        name: 'addresses',
        length: ADDRESS_LENGTH,
        _toString: toChecksumAddress,
    },
    {
        name: 'viewingKeys',
        length: VIEWING_KEY_LENGTH,
    },
    {
        name: 'appData',
    },
];
