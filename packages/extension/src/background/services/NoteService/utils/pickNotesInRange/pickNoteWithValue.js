import {
    randomInts,
} from '~/utils/random';

export default function pickNoteWithValue({
    noteValues,
    value,
    numberOfNotes,
    allowLessNumberOfNotes,
}) {
    if (!noteValues[value]
        || (noteValues[value].length < numberOfNotes && !allowLessNumberOfNotes)
    ) {
        return [];
    }

    const count = Math.min(numberOfNotes, noteValues[value].length);
    return randomInts(count, 0, noteValues[value].length - 1)
        .map(index => ({
            value,
            key: noteValues[value][index],
        }));
}
