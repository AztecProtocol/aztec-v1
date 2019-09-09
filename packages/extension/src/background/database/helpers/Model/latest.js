import db from '../../'

export default async function latest(modelName, {orderBy, filterOptions}) {
    let collectionRaw = db[modelName]
    
    const keys = Object.keys(filterOptions);
    
    const collection = keys.reduce((acum, key) => acum.where(key).equalsIgnoreCase(filterOptions[key]), collectionRaw);
    
    if(keys.length) {
        const items = await collection.sortBy(orderBy);
        if (items.length) {
            return items[0];
        }
        return null;
    }

    return collection.orderBy(orderBy).last();
}