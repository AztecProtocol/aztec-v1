export default function getNoteValuesInRange({
    noteValues,
    greaterThan,
    lessThan,
}) {
    const validNoteValues = {};
    Object.keys(noteValues).forEach((value) => {
        const intValue = +value;
        if (typeof greaterThan === 'number'
            && intValue <= greaterThan
        ) return;
        if (typeof lessThan === 'number'
            && intValue >= lessThan
        ) return;
        validNoteValues[value] = noteValues[value];
    });

    return validNoteValues;
}
