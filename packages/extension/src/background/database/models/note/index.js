import Model from '../../helpers/Model';

export default Model({
    name: 'note',
    version: 1,
    pk: 'noteHash',
    fields: [
        'noteHash',
        'asset',
        'blockNumber',
        'owner',
        // 'assetOwner',
    ],
    optionalFields: [
        // 'owner',
        // 'viewingKey',
        // 'status',
        // 'blockNumber',
    ],
    autoFields: {
        assetOwner: {
            childFields: ['asset', 'owner'],
        },
    },
});
