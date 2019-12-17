import {
    utils,
} from 'web3';
import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
    METADATA_AZTEC_DATA_LENGTH,
    MIN_BYTES_VAR_LENGTH,
    DYNAMIC_VAR_CONFIG_LENGTH,
} from '~/config/constants';
import metadata, {
    toString,
    addAccess,
} from '../metadata';

const base16 = num => num.toString(16);
const padVar = (val, padWith = '0') => `${base16(val)}`.padStart(DYNAMIC_VAR_CONFIG_LENGTH, padWith);
const padOffset = offset => padVar(offset / 2);
const padValues = (val, valLen) => `${padVar(valLen ? val.length / valLen : 0)}${val}`;

const aztecData = ''.padEnd(METADATA_AZTEC_DATA_LENGTH, 'a');
const aztecDataByte = `0x${aztecData}`;
const appData = ''.padEnd(80, 'd');
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
const addressesStr = addresses
    .map(a => utils.toChecksumAddress(a).slice(2))
    .map(a => a.padStart(MIN_BYTES_VAR_LENGTH, '0'))
    .join('');
const viewingKeysStr = viewingKeys.join('');

const numberOfNewAccounts = 2;
const newAddressBytes = [];
const newViewingKeyBytes = [];
for (let i = 0; i < numberOfNewAccounts; i += 1) {
    newAddressBytes.push('0x'.padEnd(ADDRESS_LENGTH + 2, `adf${i}`));
    newViewingKeyBytes.push('0x'.padEnd(VIEWING_KEY_LENGTH + 2, `cf${i}`));
}

const fixedOffset = METADATA_AZTEC_DATA_LENGTH + (DYNAMIC_VAR_CONFIG_LENGTH * 3);

describe('metadata toString', () => {
    it('generate a metadata string from data object', () => {
        expect(MIN_BYTES_VAR_LENGTH > ADDRESS_LENGTH).toBe(true);

        const segAddresses = padValues(addressesStr, MIN_BYTES_VAR_LENGTH);
        const segViewingKeys = padValues(viewingKeysStr, VIEWING_KEY_LENGTH);
        const expectedStr = [
            '0x',
            aztecData,
            padOffset(fixedOffset),
            padOffset(fixedOffset + segAddresses.length),
            padOffset(fixedOffset + segAddresses.length + segViewingKeys.length),
            segAddresses,
            segViewingKeys,
            padValues(appData, appData.length),
        ].join('');

        expect(expectedStr).toMatch(/^0x[0-9a-f]+$/i);

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
            aztecData,
            padOffset(fixedOffset),
            padOffset(fixedOffset + DYNAMIC_VAR_CONFIG_LENGTH),
            padOffset(fixedOffset + (DYNAMIC_VAR_CONFIG_LENGTH * 2)),
            padValues('', MIN_BYTES_VAR_LENGTH),
            padValues('', VIEWING_KEY_LENGTH),
            padValues(appData, appData.length),
        ].join('');

        expect(toString({
            aztecData,
            appData,
        })).toBe(expectedStr);
    });

    it('allow empty object', () => {
        const expectedStr = [
            '0x',
            ''.padStart(METADATA_AZTEC_DATA_LENGTH, '0'),
            padOffset(fixedOffset),
            padOffset(fixedOffset + DYNAMIC_VAR_CONFIG_LENGTH),
            padOffset(fixedOffset + (DYNAMIC_VAR_CONFIG_LENGTH * 2)),
            padValues('', MIN_BYTES_VAR_LENGTH),
            padValues('', VIEWING_KEY_LENGTH),
            padValues('', 0),
        ].join('');

        expect(toString({})).toBe(expectedStr);
    });
});

describe('metadata constructor', () => {
    const obj = {
        aztecData,
        addresses,
        viewingKeys,
        appData,
    };
    const metadataStr = toString(obj);

    it('parse a string into object', () => {
        expect(metadata(metadataStr)).toMatchObject({
            aztecData: aztecDataByte,
            addresses: addressBytes.map(utils.toChecksumAddress),
            viewingKeys: viewingKeyBytes,
            appData: appDataByte,
        });
    });

    it('allow zero length info', () => {
        const objWithNoAccess = {
            aztecData,
            appData,
        };
        const metadataStrWithNoAccess = toString(objWithNoAccess);

        expect(metadata(metadataStrWithNoAccess)).toMatchObject({
            aztecData: aztecDataByte,
            addresses: [],
            viewingKeys: [],
            appData: appDataByte,
        });
    });

    it('allow empty string', () => {
        expect(metadata('')).toMatchObject({
            aztecData: '',
            addresses: [],
            viewingKeys: [],
            appData: '',
        });
    });

    it('get access by address', () => {
        const m = metadata(metadataStr);
        expect(m.getAccess(addressBytes[0])).toEqual({
            address: utils.toChecksumAddress(addressBytes[0]),
            viewingKey: viewingKeyBytes[0],
        });
        expect(m.getAccess(addressBytes[1])).toEqual({
            address: utils.toChecksumAddress(addressBytes[1]),
            viewingKey: viewingKeyBytes[1],
        });
    });

    it('add access to metadata object', () => {
        const m = metadata(metadataStr);
        m.addAccess({
            address: newAddressBytes[0],
            viewingKey: newViewingKeyBytes[0],
        });
        expect(m.addresses).toEqual([
            ...addressBytes,
            newAddressBytes[0],
        ].map(utils.toChecksumAddress));
        expect(m.viewingKeys).toEqual([
            ...viewingKeyBytes,
            newViewingKeyBytes[0],
        ]);
    });

    it('add multiple access to metadata object', () => {
        const m = metadata(metadataStr);
        m.addAccess([
            {
                address: newAddressBytes[0],
                viewingKey: newViewingKeyBytes[0],
            },
            {
                address: newAddressBytes[1],
                viewingKey: newViewingKeyBytes[1],
            },
        ]);
        expect(m.addresses).toEqual([
            ...addressBytes,
            newAddressBytes[0],
            newAddressBytes[1],
        ].map(utils.toChecksumAddress));
        expect(m.viewingKeys).toEqual([
            ...viewingKeyBytes,
            newViewingKeyBytes[0],
            newViewingKeyBytes[1],
        ]);
    });

    it('will not add existing access to metadata object', () => {
        const m = metadata(metadataStr);
        m.addAccess({
            address: newAddressBytes[0],
            viewingKey: newViewingKeyBytes[0],
        });
        expect(m.addresses).toEqual([
            ...addressBytes,
            newAddressBytes[0],
        ].map(utils.toChecksumAddress));
        expect(m.viewingKeys).toEqual([
            ...viewingKeyBytes,
            newViewingKeyBytes[0],
        ]);

        m.addAccess({
            address: newAddressBytes[0],
            viewingKey: newViewingKeyBytes[0],
        });
        expect(m.addresses).toEqual([
            ...addressBytes,
            newAddressBytes[0],
        ].map(utils.toChecksumAddress));
        expect(m.viewingKeys).toEqual([
            ...viewingKeyBytes,
            newViewingKeyBytes[0],
        ]);

        m.addAccess([
            {
                address: newAddressBytes[1],
                viewingKey: newViewingKeyBytes[1],
            },
            {
                address: newAddressBytes[1],
                viewingKey: newViewingKeyBytes[1],
            },
        ]);
        expect(m.addresses).toEqual([
            ...addressBytes,
            newAddressBytes[0],
            newAddressBytes[1],
        ].map(utils.toChecksumAddress));
        expect(m.viewingKeys).toEqual([
            ...viewingKeyBytes,
            newViewingKeyBytes[0],
            newViewingKeyBytes[1],
        ]);
    });
});

describe('addAccess util', () => {
    const obj = {
        aztecData,
        addresses,
        viewingKeys,
        appData,
    };
    const metadataStr = toString(obj);

    it('take a metadata object and add note access info to it', () => {
        const m = metadata(metadataStr);
        const newMetadata = addAccess(m, {
            address: newAddressBytes[0],
            viewingKey: newViewingKeyBytes[0],
        });

        expect(newMetadata).toMatchObject({
            aztecData: aztecDataByte,
            addresses: [
                ...addressBytes,
                newAddressBytes[0],
            ].map(utils.toChecksumAddress),
            viewingKeys: [
                ...viewingKeyBytes,
                newViewingKeyBytes[0],
            ],
            appData: appDataByte,
        });
    });

    it('take a metadata string and return a string with new access info', () => {
        const newMetadata = addAccess(metadataStr, {
            address: newAddressBytes[0],
            viewingKey: newViewingKeyBytes[0],
        });

        const expectedStr = toString({
            aztecData: aztecDataByte,
            addresses: [
                ...addressBytes,
                newAddressBytes[0],
            ].map(utils.toChecksumAddress),
            viewingKeys: [
                ...viewingKeyBytes,
                newViewingKeyBytes[0],
            ],
            appData: appDataByte,
        });
        expect(newMetadata).toBe(expectedStr);
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
            ].map(utils.toChecksumAddress),
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

    it('allow empty metadataStr', () => {
        const newMetadata = addAccess('', [
            {
                address: addressBytes[0],
                viewingKey: viewingKeyBytes[0],
            },
        ]);

        const addressStr = padValues(
            utils.toChecksumAddress(addresses[0]).slice(2).padStart(MIN_BYTES_VAR_LENGTH, '0'),
            MIN_BYTES_VAR_LENGTH,
        );
        const viewingKeyStr = padValues(
            viewingKeys[0].padStart(MIN_BYTES_VAR_LENGTH, '0'),
            VIEWING_KEY_LENGTH,
        );
        const expectedStr = [
            '0x',
            ''.padStart(METADATA_AZTEC_DATA_LENGTH, '0'),
            padOffset(fixedOffset),
            padOffset(fixedOffset + addressStr.length),
            padOffset(fixedOffset + addressStr.length + viewingKeyStr.length),
            addressStr,
            viewingKeyStr,
            padValues('', 0),
        ].join('');

        expect(newMetadata).toBe(expectedStr);
    });
});
