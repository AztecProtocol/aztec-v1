export default function excludeNoteKeys(noteValues, excludes) {
    let validNoteValues = noteValues;
    if (excludes && excludes.length > 0) {
        validNoteValues = {
            ...noteValues,
        };
        excludes.forEach(({
            value,
            key,
        }) => {
            const keys = validNoteValues[value];
            if (!keys || !keys.length) return;
            validNoteValues[value] = keys.filter(k => k !== key);
        });
    }
    return validNoteValues;
}
