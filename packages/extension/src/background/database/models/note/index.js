import Model from '../../helpers/Model';

export default Model({
    name: 'note',
    version: 1,
    pk: 'noteHash',
    fields: [
        'noteHash',
        'asset',
    ],
    // optionalFields: [
    //     'owner',
    //     'viewingKey',
    //     'status',
    //     'blockNumber',
    // ],
});
