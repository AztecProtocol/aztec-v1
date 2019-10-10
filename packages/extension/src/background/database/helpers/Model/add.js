import {
    getDB,
} from '../..';
import appendAutoFields from './helpers/appendAutoFields';


export default async function add(modelName, item, config) {
    const {
        options: { networkId },
        modelConfig,
    } = config;

    const resultItem = appendAutoFields(item, modelConfig);
    const id = await getDB(networkId)[modelName].add(resultItem);

    return {
        id,
    };
}
