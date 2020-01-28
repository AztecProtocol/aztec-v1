export default function groupBy(arr, callback) {
    const grouped = {};
    for (let i = 0; i < arr.length; i += 1) {
        const value = callback(arr[i]);
        if (!grouped[value]) {
            grouped[value] = [];
        }
        grouped[value].push(arr[i]);
    }
    return grouped;
}
