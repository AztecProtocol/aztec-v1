const aztecDataLength = 33;

export default [
    {
        name: 'aztecData',
        length: aztecDataLength,
    },
    {
        name: 'addressesLength',
        length: 32,
    },
    {
        name: 'viewingKeysLength',
        length: 32,
    },
    {
        name: 'appDataLength',
        length: 32,
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
