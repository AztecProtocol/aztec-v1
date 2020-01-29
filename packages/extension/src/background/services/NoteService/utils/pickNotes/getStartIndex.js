export default function getStartIndex(sortedValues, minSum, count) {
    const suffixSum = count <= 1
        ? 0
        : sortedValues
            .slice(-(count - 1))
            .reduce((accum, val) => accum + val, 0);
    const ceil = (sortedValues.length - count) + 1;
    let start = 0;

    while (start < ceil) {
        if (suffixSum + sortedValues[start] >= minSum) {
            return start;
        }

        do {
            start += 1;
        } while (sortedValues[start] === sortedValues[start - 1]);
    }

    return -1;
}
