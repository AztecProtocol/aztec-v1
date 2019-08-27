import db from '../../'

export default async function latest(modelName, {orderBy, filterFunc}) {
    let objs;
    if (filterFunc) {
        objs = await db[modelName].orderBy(orderBy).filter(filterFunc).toArray();
    } else {
        objs = await db[modelName].orderBy(orderBy).toArray();
    }

    if(objs && objs.length) {
        return objs[objs.length - 1];
    }
    
    return  null;
}