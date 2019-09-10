import Model from './../../helpers/Model';

export default Model({
    name: 'note',
    version: 1,
    fields: [
        // Primary Key | first key is always primary key
        'noteHash',
        'owner',
        'metadata',
        'blockNumber',
        'status',
        'asset', // address
    ],
});
