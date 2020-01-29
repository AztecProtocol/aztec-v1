import Model from '../../helpers/Model';

export default Model({
    name: 'sync',
    version: 1,
    pk: 'id',
    fields: [
        'asset', // address
        'lastBlockNumber',
        'networkId',
    ],
    autoFields: {
        id: {
            childFields: ['asset', 'networkId'],
        },
    },
});
