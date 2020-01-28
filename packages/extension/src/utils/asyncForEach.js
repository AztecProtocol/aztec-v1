export default async function asyncForEach(arr, callback) {
    for (let i = 0; i < arr.length; i += 1) {
        await callback(arr[i], i, arr); // eslint-disable-line no-await-in-loop
    }
}
