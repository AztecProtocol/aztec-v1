import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
} from '~config/constants';
import metadata, {
    toString,
} from '../metadata';

const pad = (val, len, padWith = '0') => `${val}`.padStart(len, padWith);

const aztecData = ''.padStart(33, 'a');
const appData = ''.padStart(10, 'p');
const addresses = [];
const viewingKeys = [];
for (let i = 0; i < 3; i += 1) {
    addresses.push('0x'.padEnd(ADDRESS_LENGTH, '0'));
    viewingKeys.push(''.padEnd(VIEWING_KEY_LENGTH, '0'));
}
const addressesStr = addresses.join('');
const viewingKeysStr = viewingKeys.join('');

describe('metadata toString', () => {
    it('generate a metadata string from data object', () => {
        const expectedStr = [
            '0x',
            pad(aztecData, 33),
            pad(addressesStr.length, 32),
            pad(viewingKeysStr.length, 32),
            pad(appData.length, 32),
            addressesStr,
            viewingKeysStr,
            appData,
        ].join('');

        expect(toString({
            aztecData,
            addresses,
            viewingKeys,
            appData,
        })).toBe(expectedStr);
    });

    it('allow undefined data in object', () => {
        const expectedStr = [
            '0x',
            pad(aztecData, 33),
            pad('0', 32),
            pad('0', 32),
            pad(appData.length, 32),
            appData,
        ].join('');

        expect(toString({
            aztecData,
            appData,
        })).toBe(expectedStr);
    });
});

describe('metadata constructor', () => {
    it('parse a string into object', () => {
        const obj = {
            aztecData,
            addresses,
            viewingKeys,
            appData,
        };
        const metadataStr = toString(obj);

        expect(metadata(metadataStr)).toMatchObject(obj);
    });

    it('allow zero length info', () => {
        const obj = {
            aztecData,
            appData,
        };
        const metadataStr = toString(obj);

        expect(metadata(metadataStr)).toMatchObject({
            ...obj,
            addresses: [],
            viewingKeys: [],
        });
    });
});
