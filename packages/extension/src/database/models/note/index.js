import dataKey from '~config/dataKey';
import Model from '~database/helpers/Model';

export default Model({
    name: 'note',
    dataKeyPattern: dataKey.note,
    fields: [
        'sharedSecret',
        'value',
        'asset',
        'owner',
        'status',
    ],
});
