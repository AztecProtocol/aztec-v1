import db from '../../'

export default async function latest(modelName, orderBy) {

    let objs = await db[modelName].orderBy(orderBy).toArray();
    if(objs && objs.length) {
        return objs[objs.length - 1];
    }
    
    return  null;
}