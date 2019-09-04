import {
    ADDRESS_LENGTH,
    USER_PUBLIC_KEY_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
    DYNAMIC_VAR_CONFIG_LENGTH,
} from '../../src/config/constants';

export const numberOfAccount = 10;
export const numberOfAssets = 3;
export const numberOfNotes = 99;

export const entityId = (entity, index) => `__${entity}_id_${index}`;

export const enitityAddress = (entity, index) => [
    '0x_',
    entity,
    '_'.padEnd(ADDRESS_LENGTH - 13 - entity.length - Math.ceil((index + 1) / 10), '0'),
    '_address_',
    `_${index}`,
].join('');

export {
    ADDRESS_LENGTH,
    USER_PUBLIC_KEY_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
    DYNAMIC_VAR_CONFIG_LENGTH,
};
