import Model from './../../helpers/Model';

export default Model({
    name: 'noteAccess',
    version: 1,
    fields: [
        // Primary Key | first key is always primary key
        'id', // `${account}_${asset}`
        'noteHash',
        'account',
        'viewingKey',
        'blockNumber',
        'asset',
    ],
});