import db from '../../';
import {
    errorLog
} from '~utils/log';

// add
import add from './add';
import bulkAdd from './bulkAdd';

// update
import put from './put';
import bulkPut from './bulkPut';

// retrieve
import get from './get';
import query from './query';
import latest from './latest';


/* 
* Format of config file
* {
*   name: "Account"
*   version: 1,
*   fields: [
*       '++id',
*       'firstName',
*       'lastName',
*   ]
* }
*/
export default function Model(modelConfig) {
    const { name, version, fields } = modelConfig
    
    if(!name) {
        errorLog('Cannot define new indexDb model, as "name" is not defined');
        return;
    }

    if(!version) {
        errorLog('Cannot define new indexDb "${name}" model, as "version" is not uefined');
        return;
    }

    if(!fields 
        || !Array.isArray(fields)
        || fields.length < 1) {
        errorLog(`Cannot define new indexDb "${name}" model, as "fields" value is not array or it is empty`);
        return;
    }
    
    const dexieConfig = {};
    dexieConfig[name] = fields.join(',');
    db.version(version).stores(dexieConfig);

    return {
        add: (item) => add(name, item),
        bulkAdd: (items) => bulkAdd(name, items),
        put: (items) => put(name, items),
        bulkPut: (items) => bulkPut(name, items),
        get: (fields) => get(name, fields),
        query: () => query(name),
        latest: ({orderBy = 'blockNumber', filterOptions = {}} = {orderBy: 'blockNumber', filterOptions: {}}) => latest(name, {orderBy, filterOptions}),
    }
}