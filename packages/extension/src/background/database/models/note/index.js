import Model from '../../helpers/Model';

export default Model({
    name: 'note',
    version: 1,
    pk: 'noteHash',
    fields: [
        'noteHash',
        'owner',
        'metadata',
        'blockNumber',
        'status',
        'asset', // address
    ],
    autoFields: {
        ownerAssetStatus: {
            childFields: ['owner', 'asset', 'status'],
        },
    },
});
