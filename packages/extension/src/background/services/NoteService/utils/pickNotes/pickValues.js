import {
    randomInts,
} from '~/utils/random';

export default function pickValues(sortedValues, count, start, end) {
    const selectedIndexes = randomInts(count, start, end);
    return selectedIndexes.map(idx => sortedValues[idx]);
}
