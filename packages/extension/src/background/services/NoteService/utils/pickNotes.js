import {
    argsError,
} from '~utils/error';
import {
    randomInts,
} from '~utils/random';

const generateSortedValues = (noteValues) => {
    const values = [];
    let size = 0;
    Object.keys(noteValues).forEach((value) => {
        const numberOfNotes = noteValues[value].length;
        values.length += numberOfNotes;
        values.fill(+value, size);
        size += numberOfNotes;
    });

    return values.sort((a, b) => a - b);
};

const arraySum = arr => arr.reduce((sum, v) => sum + v, 0);

const pickValues = (sortedValues, count, start, end) => {
    const selectedIndexes = randomInts(count, start, end);
    return selectedIndexes.map(idx => sortedValues[idx]);
};

const pickKeysByValues = (noteValues, values) => {
    const keys = [];
    let count = 0;
    for (let i = 0; i < values.length; i += count) {
        let end = i + 1;
        const value = values[i];
        while (values[end] === value) end += 1;
        count = end - i;
        const noteCount = noteValues[value].length;
        const indexes = randomInts(count, noteCount - 1);
        indexes.forEach((idx) => {
            keys.push(noteValues[value][idx]);
        });
    }

    return keys;
};

export default function pickNotes({
    noteValues,
    minSum,
    count,
}) {
    const sortedValues = generateSortedValues(noteValues);
    const maxSet = sortedValues.slice(-count);
    const maxSum = arraySum(maxSet);
    if (minSum > maxSum) {
        throw argsError('note.pick.count');
    }

    const totalNotes = sortedValues.length;
    if (totalNotes <= count) {
        return maxSet;
    }

    let values;
    let start = 0;
    while (start < totalNotes - 1) {
        values = pickValues(sortedValues, count, start, totalNotes - 1);
        if (arraySum(values) >= minSum) {
            break;
        }
        // skip redundant identical values
        const minValue = sortedValues[start];
        const firstMinIndex = sortedValues.indexOf(minValue, start);
        const lastMinIndex = sortedValues.lastIndexOf(minValue);
        start = Math.max(
            firstMinIndex + 1,
            (lastMinIndex - count) + 1,
        );
    }

    return pickKeysByValues(noteValues, values);
}
