import Model from '~database/helpers/Model';

export default Model({
    name: 'noteAccess',
    fields: [
        'sharedSecret',
        'value',
        'asset',
        'owner',
        'status',
    ],
});
