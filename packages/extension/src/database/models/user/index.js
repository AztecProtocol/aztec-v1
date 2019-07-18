import Model from '~database/helpers/Model';

export default Model({
    name: 'user',
    fields: {
        key: 'address',
        fields: [
            'address',
            'lastSynced',
        ],
    },
});
