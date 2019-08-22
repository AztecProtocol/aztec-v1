import Model from './../../helpers/Model';

export default Model({
    name: 'сreateNoteRegistry',
    version: 1,
    fields: [
        '++id',
        'blockNumber',
        'registryOwner',
        'registryAddress',
        'scalingFactor',
        'linkedTokenAddress',
        'canAdjustSupply',
        'canConvert',
    ],
});