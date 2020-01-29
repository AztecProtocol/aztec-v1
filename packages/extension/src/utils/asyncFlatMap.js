import asyncForEach from './asyncForEach';

export default async function asyncFlatMap(arr, callback) {
    const resultMap = [];
    await asyncForEach(arr, async (val, i) => {
        const result = await callback(val, i);
        resultMap.push(result);
    });

    return Array.prototype.concat.apply([], resultMap);
}
