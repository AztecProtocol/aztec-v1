import Model from './../../helpers/Model';

export default Model({
    name: 'note',
    version: 1,
    fields: [
        // Primary Key is auto-incremented (++id) | first key is always primary key
        '++id',
        'owner',
        // NoteHash is unique (&)
        '&noteHash',
        'metadata',
        'blockNumber',
        'status',
    ],
});
