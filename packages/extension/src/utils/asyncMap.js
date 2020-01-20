import asyncForEach from './asyncForEach';

export default async function asyncMap(arr, callback) {
    const resultMap = [];
    await asyncForEach(arr, async (val, i) => {
        const result = await callback(val, i);
        resultMap.push(result);
    });

    return resultMap;
}
