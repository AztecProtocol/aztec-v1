export default function getNoteValuesInRange({
    noteValues,
    greaterThan,
    lessThan,
}) {
    const validNoteValues = {};
    Object.keys(noteValues).forEach((value) => {
        const intValue = +value;
        if (greaterThan !== undefined
            && intValue <= greaterThan
        ) return;
        if (lessThan !== undefined
            && intValue >= lessThan
        ) return;
        validNoteValues[value] = noteValues[value];
    });

    return validNoteValues;
}
