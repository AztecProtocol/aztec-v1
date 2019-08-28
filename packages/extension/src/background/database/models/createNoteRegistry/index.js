import Model from './../../helpers/Model';

export default Model({
    name: 'сreateNoteRegistry',
    version: 1,
    fields: [
        // Primary Key is auto-incremented (++id) | first key is always primary key
        '++id',
        'blockNumber',
        // registryOwner is unique (&)
        '&registryOwner',
        'registryAddress',
        'scalingFactor',
        'linkedTokenAddress',
        'canAdjustSupply',
        'canConvert',
    ],
});