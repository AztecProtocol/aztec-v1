import {
    registerModel,
} from '../../';
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

    registerModel(db => {
        db.version(version).stores(dexieConfig);
    });
    
    return {
        // mutations
        add: (item, options) => add(name, item, options),
        bulkAdd: (items, options) => bulkAdd(name, items, options),
        put: (items, options) => put(name, items, options),
        bulkPut: (items, options) => bulkPut(name, items, options),
        
        // query
        get: (options, fields) => get(name, options, fields),
        query: (options) => query(name, options),
        latest: (options,
        {
            orderBy = 'blockNumber', 
            filterOptions = {}
        } = {
            orderBy: 'blockNumber', 
            filterOptions: {}
        }) => latest(name, options, {orderBy, filterOptions}),
    }
}