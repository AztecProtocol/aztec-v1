import {
    getDB,
} from '../..';

/* see documentations for dexie https://dexie.org/docs/Collection/Collection */
export default function query(modelName, { networkId }) {
    return getDB(networkId)[modelName];
}
