import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
    METADATA_VAR_LEN_LENGTH,
} from '~config/constants';
import metadata, {
    toString,
    addAccess,
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

describe('metadata addAccess', () => {
    const obj = {
        aztecData,
        addresses,
        viewingKeys,
        appData,
    };
    const metadataStr = toString(obj);

    const numberOfNewAccounts = 2;
    const newAddressBytes = [];
    const newViewingKeyBytes = [];
    for (let i = 0; i < numberOfNewAccounts; i += 1) {
        newAddressBytes.push('0x'.padEnd(ADDRESS_LENGTH + 2, `adn${i}`));
        newViewingKeyBytes.push('0x'.padEnd(VIEWING_KEY_LENGTH + 2, `cn${i}`));
    }

    it('add note access info to metadata string', () => {
        const newMetadata = addAccess(metadataStr, {
            address: newAddressBytes[0],
            viewingKey: newViewingKeyBytes[0],
        });

        expect(metadata(newMetadata)).toMatchObject({
            aztecData: aztecDataByte,
            addresses: [
                ...addressBytes,
                newAddressBytes[0],
            ],
            viewingKeys: [
                ...viewingKeyBytes,
                newViewingKeyBytes[0],
            ],
            appData: appDataByte,
        });
    });

    it('can add multiple note access at a time', () => {
        const newMetadata = addAccess(metadataStr, [
            {
                address: newAddressBytes[0],
                viewingKey: newViewingKeyBytes[0],
            },
            {
                address: newAddressBytes[1],
                viewingKey: newViewingKeyBytes[1],
            },
        ]);

        expect(metadata(newMetadata)).toMatchObject({
            aztecData: aztecDataByte,
            addresses: [
                ...addressBytes,
                newAddressBytes[0],
                newAddressBytes[1],
            ],
            viewingKeys: [
                ...viewingKeyBytes,
                newViewingKeyBytes[0],
                newViewingKeyBytes[1],
            ],
            appData: appDataByte,
        });
    });

    it('ignore address that is already in metadata', () => {
        const newMetadata = addAccess(metadataStr, [
            {
                address: newAddressBytes[0],
                viewingKey: newViewingKeyBytes[0],
            },
        ]);

        const newNewMetadata = addAccess(metadataStr, [
            {
                address: newAddressBytes[0],
                viewingKey: newViewingKeyBytes[0],
            },
        ]);

        expect(newNewMetadata).toBe(newMetadata);
    });
});
