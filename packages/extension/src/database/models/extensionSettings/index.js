import Model from '~/database/helpers/Model';

export default Model({
    name: 'extensionSettings',
    fields: {
        key: 'name',
        fields: [
            'name',
            'value',
        ],
    },
});
