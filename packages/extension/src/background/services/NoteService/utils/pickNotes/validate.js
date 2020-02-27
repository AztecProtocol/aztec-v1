import {
    argsError,
} from '~/utils/error';
import arraySum from './arraySum';

export default function validate({
    sortedValues,
    minSum,
    numberOfNotes = null,
    allowLessNumberOfNotes = true,
}) {
    const count = numberOfNotes === null
        ? sortedValues.length
        : numberOfNotes;
    const maxSet = sortedValues.slice(-count);
    const maxSum = arraySum(maxSet);
    if (minSum > maxSum) {
        throw argsError('note.pick.minSum', {
            messageOptions: {
                count: numberOfNotes || '',
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
                count: numberOfNotes || '',
            },
            numberOfNotes,
            totalNotes: sortedValues.length,
        });
    }

    return sortedValues;
}
