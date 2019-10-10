import {
    getDB,
} from '../..';
import appendAutoFields from './helpers/appendAutoFields';

/*
* If the operation succeeds then the returned Promise resolves to the key under which the object was stored in the Table
*/
export default async function put(modelName, item, config) {
    const {
        options: { networkId },
        modelConfig,
    } = config;

    const resultItem = appendAutoFields(item, modelConfig);
    return getDB(networkId)[modelName].put(resultItem);
}
