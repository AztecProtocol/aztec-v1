import Model from '../../helpers/Model';

export default Model({
    name: 'asset',
    version: 1,
    pk: 'registryOwner',
    fields: [
        'registryOwner',
        'blockNumber',
        'registryAddress',
        'linkedTokenAddress',
        'scalingFactor',
        'canAdjustSupply',
        'canConvert',
        '[blockNumber+registryOwner]',
    ],
});
