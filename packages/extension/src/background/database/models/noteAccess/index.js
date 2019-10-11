import Model from '../../helpers/Model';


export default Model({
    name: 'noteAccess',
    version: 1,
    pk: 'id',
    fields: [
        'noteHash',
        'account',
        'viewingKey',
        'blockNumber',
        'asset',
    ],
    autoFields: {
        id: {
            childFields: ['account', 'noteHash'],
        },
    },
});
