import db from '../../'

/* see documentations for dexie https://dexie.org/docs/Collection/Collection */
export default function query(modelName) {
    return db[modelName];
};