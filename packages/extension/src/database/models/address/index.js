import dataKey from '~/config/dataKey';
import Model from '~/database/helpers/Model';

/**
 * This model is for storing addresses in key value pair
 * so that other models can store shorten key
 * and look up the real address if necessary
 */
export default Model({
    name: 'address',
    dataKeyPattern: dataKey.address,
    index: 'address',
    fields: [
        'address',
    ],
});
