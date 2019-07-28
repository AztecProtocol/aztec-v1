import asyncForEach from './asyncForEach';

export default async function asyncMap(arr, callback) {
    const resultMap = [];
    await asyncForEach(arr, async (val) => {
        const result = await callback(val);
        resultMap.push(result);
    });

    return resultMap;
}
