import dataKey from '~/config/dataKey';
import Model from '~/database/helpers/Model';

export default Model({
    name: 'noteAccess',
    dataKeyPattern: dataKey.noteAccess,
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
