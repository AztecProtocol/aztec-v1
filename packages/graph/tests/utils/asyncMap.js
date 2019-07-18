export default async function asyncMap(arr, callback) {
    const result = [];
    for (let i = 0; i < arr.length; i += 1) {
        const r = await callback(arr[i], i, arr); // eslint-disable-line no-await-in-loop
        result.push(r);
    }
    return result;
}
