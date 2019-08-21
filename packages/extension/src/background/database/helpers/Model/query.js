import db from '../../'

export default async function query(modelName, {filterFunc, orderBy} ) {

    let query = db[modelName].filter(filterFunc);
    if (orderBy) {
        query = query.orderBy(orderBy);
    }
    return await query.toArray();
}