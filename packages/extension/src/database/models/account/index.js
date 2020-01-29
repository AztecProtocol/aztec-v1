import dataKey from '~/config/dataKey';
import Model from '~/database/helpers/Model';

export default Model({
    name: 'account',
    dataKeyPattern: dataKey.account,
    index: 'address',
    fields: [
        'address',
    ],
});
