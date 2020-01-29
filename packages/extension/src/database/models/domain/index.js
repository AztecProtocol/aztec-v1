import Model from '~/database/helpers/Model';

export default Model({
    name: 'domain',
    fields: {
        key: 'domain',
        fields: [
            'assets',
        ],
    },
});
