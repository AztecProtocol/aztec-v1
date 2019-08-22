import db from '../../';
import {
    errorLog
} from '~utils/log';
import add from './add';
import update from './update';
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

    const dexieConfig = {}
    dexieConfig[name] = fields.join(',')
    db.version(version).stores(dexieConfig);

    return {
        add: (fields) => add(name, fields),
        update: (id, fields) => update(name, id, fields),
        query: (filterFunc, orderBy) => query(name, {filterFunc, orderBy}),
        latest: ({byField: orderBy}) => latest(name, orderBy),
    }
}