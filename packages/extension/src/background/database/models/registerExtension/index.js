import Model from './../../helpers/Model';

export default Model({
    name: 'registerExtension',
    version: 1,
    fields: [
        '++id',
        'address',
        'blockNumber',
        'linkedPublicKey',
        'registeredAt',
    ],
});
