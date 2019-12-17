import dataKey from '~/config/dataKey';
import Model from '~/database/helpers/Model';

export default Model({
    name: 'asset',
    dataKeyPattern: dataKey.asset,
    index: 'address',
    fields: [
        'address',
        'linkedTokenAddress',
        'scalingFactor',
        'canAdjustSupply',
        'canConvert',
    ],
});
