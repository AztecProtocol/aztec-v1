import Model from '../../helpers/Model';


export default Model({
    name: 'account',
    version: 1,
    fields: [
        // Primary Key | first key is always primary key
        'address',
        'linkedPublicKey',
        'blockNumber',
    ],
});
