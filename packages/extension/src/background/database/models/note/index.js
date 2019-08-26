import Model from './../../helpers/Model';

export default Model({
    name: 'note',
    version: 1,
    fields: [
        '++id',
        'owner',
        'noteHash',
        'metadata',
        'blockNumber',
    ],
});
