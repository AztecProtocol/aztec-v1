import {
    getDB,
} from '../..';
import appendAutoFields from './helpers/appendAutoFields';

/*
* If the operation succeeds then the returned Promise resolves to the key under which the object was stored in the Table
*/
export default async function update(modelName, item, config) {
    const {
        options: { networkId },
        modelConfig,
    } = config;

    const resultItem = appendAutoFields(item, modelConfig);
    const resp = await getDB(networkId)[modelName].update(item[modelConfig.pk], resultItem);
    return resp;
}
