import Model from './../../helpers/Model';

export default Model({
    name: 'account',
    version: 1,
    fields: [
        // Primary Key is auto-incremented (++id) | first key is always primary key
        '++id',
        // Address is unique (&)
        '&address',
        'blockNumber',
        'linkedPublicKey',
        'registeredAt',
    ],
});
