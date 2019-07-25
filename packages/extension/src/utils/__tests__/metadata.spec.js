import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
    METADATA_VAR_LEN_LENGTH,
} from '~config/constants';
import metadata, {
    toString,
} from '../metadata';

const pad = (val, len, padWith = '0') => `${val}`.padStart(len, padWith);
const base16 = num => num.toString(16);

const aztecData = ''.padEnd(METADATA_AZTEC_DATA_LENGTH, 'a');
const aztecDataByte = `0x${aztecData}`;
const appData = ''.padEnd(10, 'd');
const appDataByte = `0x${appData}`;
const addresses = [];
const addressBytes = [];
const viewingKeys = [];
const viewingKeyBytes = [];
const numberOfAccounts = 3;
for (let i = 0; i < numberOfAccounts; i += 1) {
    const address = ''.padEnd(ADDRESS_LENGTH, `ad${i}`);
    addresses.push(address);
    addressBytes.push(`0x${address}`);
    const viewingKey = ''.padEnd(VIEWING_KEY_LENGTH, `c${i}`);
    viewingKeys.push(viewingKey);
    viewingKeyBytes.push(`0x${viewingKey}`);
}
const addressesStr = addresses.join('');
const viewingKeysStr = viewingKeys.join('');

describe('metadata toString', () => {
    it('generate a metadata string from data object', () => {
        const expectedStr = [
            '0x',
            pad(aztecData, METADATA_AZTEC_DATA_LENGTH),
            pad(base16(addressesStr.length), METADATA_VAR_LEN_LENGTH),
            pad(base16(viewingKeysStr.length), METADATA_VAR_LEN_LENGTH),
            pad(base16(appData.length), METADATA_VAR_LEN_LENGTH),
            addressesStr,
            viewingKeysStr,
            appData,
        ].join('');

        expect(expectedStr).toMatch(/^0x[0-9a-f]+$/);

        expect(toString({
            aztecData,
            addresses,
            viewingKeys,
            appData,
        })).toBe(expectedStr);
    });

    it('allow values in data object with prefix 0x', () => {
        const expectedStr = toString({
            aztecData,
            addresses,
            viewingKeys,
            appData,
        });

        expect(toString({
            aztecData: aztecDataByte,
            addresses: addressBytes,
            viewingKeys: viewingKeyBytes,
            appData: appDataByte,
        })).toBe(expectedStr);
    });

    it('allow undefined data in object', () => {
        const expectedStr = [
            '0x',
            pad(aztecData, METADATA_AZTEC_DATA_LENGTH),
            pad('0', METADATA_VAR_LEN_LENGTH),
            pad('0', METADATA_VAR_LEN_LENGTH),
            pad(base16(appData.length), METADATA_VAR_LEN_LENGTH),
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

        expect(metadata(metadataStr)).toMatchObject({
            aztecData: aztecDataByte,
            addresses: addressBytes,
            viewingKeys: viewingKeyBytes,
            appData: appDataByte,
        });
    });

    it('allow zero length info', () => {
        const obj = {
            aztecData,
            appData,
        };
        const metadataStr = toString(obj);

        expect(metadata(metadataStr)).toMatchObject({
            aztecData: aztecDataByte,
            addresses: [],
            viewingKeys: [],
            appData: appDataByte,
        });
    });
});
