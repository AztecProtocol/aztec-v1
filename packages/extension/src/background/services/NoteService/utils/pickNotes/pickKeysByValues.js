import {
    randomInts,
} from '~/utils/random';

export default function pickKeysByValues(noteValues, values) {
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
}
