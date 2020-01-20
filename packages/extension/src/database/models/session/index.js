import Model from '~/database/helpers/Model';

export default Model({
    name: 'session',
    fields: [
        'lastLogin',
        'createdAt',
        'address',
        'pwDerivedKey',
    ],
});
