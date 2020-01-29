import {
    getPrefix,
} from '~/utils/dataKey';

export default function parseNoteValuesStrings(noteValuesStrArr) {
    const keyPrefix = getPrefix('note');
    const noteValues = {};
    noteValuesStrArr.forEach((str) => {
        const [
            value,
            ...noteIndexes
        ] = str.split(keyPrefix);
        noteValues[value] = noteIndexes.map(idx => `${keyPrefix}${idx}`);
    });

    return noteValues;
}
