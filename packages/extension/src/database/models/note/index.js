import dataKey from '~/config/dataKey';
import Model from '~/database/helpers/Model';

export default Model({
    name: 'note',
    dataKeyPattern: dataKey.note,
    index: 'hash',
    fields: [
        'hash',
        'viewingKey',
        'value',
        'asset',
        'owner',
        'status',
    ],
});
