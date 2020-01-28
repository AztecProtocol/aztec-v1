import Model from '~/database/helpers/Model';

export default Model({
    name: 'action',
    fields: {
        key: 'timestamp',
        fields: [
            'type',
            'data',
            'requestId',
            'clientId',
            'site',
        ],
    },
});
