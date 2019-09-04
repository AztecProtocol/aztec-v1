import {
    getPrefix,
} from '~utils/dataKey';

export default function maxNoteKey(...noteKeysArr) {
    const notePrefix = getPrefix('note');
    const noteKeys = [];
    noteKeysArr.forEach((noteKey) => {
        if (Array.isArray(noteKey)) {
            noteKeys.push(...noteKey);
        } else {
            noteKeys.push(noteKey);
        }
    });

    const validKeys = noteKeys
        .filter(key => typeof key === 'string')
        .map(key => key.replace(notePrefix, ''))
        .filter(key => !!key);
    if (!validKeys.length) {
        return '';
    }

    const maxCount = Math.max(...validKeys.map(noteKey => parseInt(noteKey, 10)));

    return `${notePrefix}${maxCount}`;
}
