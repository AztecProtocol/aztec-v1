import Model from '../../helpers/Model';

export default Model({
    name: 'asset',
    version: 1,
    fields: [
        // Primary Key | first key is always primary key
        'registryOwner',
        'blockNumber',
        'registryAddress',
        'linkedTokenAddress',
        'scalingFactor',
        'canAdjustSupply',
        'canConvert',
    ],
});
