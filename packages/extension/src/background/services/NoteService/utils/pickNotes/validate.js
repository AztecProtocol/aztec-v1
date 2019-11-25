import {
    argsError,
} from '~utils/error';
import generateSortedValues from './generateSortedValues';
import arraySum from './arraySum';

export default function validate({
    noteValues,
    minSum,
    numberOfNotes,
    allowLessNumberOfNotes = true,
}) {
    if (!numberOfNotes) {
        return [];
    }

    const sortedValues = generateSortedValues(noteValues);
    const maxSet = sortedValues.slice(-numberOfNotes);
    const maxSum = arraySum(maxSet);
    if (minSum > maxSum) {
        throw argsError('note.pick.minSum', {
            messageOptions: {
                count: numberOfNotes,
            },
            numberOfNotes,
            value: minSum,
        });
    }

    if (sortedValues.length < numberOfNotes
        && !allowLessNumberOfNotes
    ) {
        throw argsError('note.pick.count', {
            messageOptions: {
                count: numberOfNotes,
            },
            numberOfNotes,
            totalNotes: sortedValues.length,
        });
    }

    return sortedValues;
}
