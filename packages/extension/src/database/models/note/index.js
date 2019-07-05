import Model from '~database/helpers/Model';

export default Model({
    name: 'note',
    fields: [
        'sharedSecret',
        'value',
        'asset',
        'owner',
        'status',
    ],
});
