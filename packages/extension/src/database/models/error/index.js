import Model from '~/database/helpers/Model';

export default Model({
    name: 'error',
    fields: {
        key: 'timestamp',
        fields: [
            'error',
        ],
    },
});
