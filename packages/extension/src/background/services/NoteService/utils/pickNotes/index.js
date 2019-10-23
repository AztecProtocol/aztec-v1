import {
    argsError,
} from '~utils/error';
import generateSortedValues from './generateSortedValues';
import getStartIndex from './getStartIndex';
import pickValues from './pickValues';
import pickKeysByValues from './pickKeysByValues';

const arraySum = arr => arr.reduce((sum, v) => sum + v, 0);

export default function pickNotes({
    noteValues,
    minSum,
    numberOfNotes: count = 1,
    allowLessNumberOfNotes = true,
}) {
    if (!count) {
        return [];
    }

    const sortedValues = generateSortedValues(noteValues);
    const maxSet = sortedValues.slice(-count);
    const maxSum = arraySum(maxSet);
    if (minSum > maxSum) {
        throw argsError('note.pick.minSum', {
            count,
            value: minSum,
        });
    }

    if (sortedValues.length < count) {
        if (!allowLessNumberOfNotes) {
            throw argsError('note.pick.count', {
                count,
            });
        }
        const notes = [];
        sortedValues.forEach((value) => {
            noteValues[value].forEach((key) => {
                notes.push({
                    key,
                    value,
                });
            });
        });
        return notes;
    }

    let values = [];
    const totalNotes = sortedValues.length;
    let start = getStartIndex(sortedValues, minSum, count);
    while (start <= totalNotes - count) {
        values = pickValues(sortedValues, count, start, totalNotes - 1);
        if (arraySum(values) >= minSum) {
            break;
        }
        // skip redundant identical values
        const minValue = values[0];
        const selectedMinValues = values.lastIndexOf(minValue) + 1;
        const firstMinIndex = sortedValues.indexOf(minValue, start);
        const lastMinIndex = sortedValues.lastIndexOf(minValue);
        start = Math.max(
            firstMinIndex + 1,
            (lastMinIndex - (selectedMinValues - 1)) + 1,
        );
    }

    const keys = pickKeysByValues(noteValues, values);
    const notes = keys.map((key, i) => ({
        key,
        value: values[i],
    }));

    return notes;
}
