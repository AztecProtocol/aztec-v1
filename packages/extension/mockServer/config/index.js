import {
    ADDRESS_LENGTH,
    PUBLIC_KEY_SECP256K1_LENGTH,
    VIEWING_KEY_LENGTH,
} from '../../src/config/constants';

export const numberOfAccount = 10;
export const numberOfAssets = 3;
export const numberOfNotes = 99;

export const addressLength = ADDRESS_LENGTH;
export const publicKeyLength = PUBLIC_KEY_SECP256K1_LENGTH;
export const viewingKeyLength = VIEWING_KEY_LENGTH;

export const entityId = (entity, index) => `__${entity}_id_${index}`;

export const enitityAddress = (entity, index) => [
    '0x_',
    entity,
    '_'.padEnd(addressLength - 13 - entity.length - Math.ceil((index + 1) / 10), '0'),
    '_address_',
    `_${index}`,
].join('');
