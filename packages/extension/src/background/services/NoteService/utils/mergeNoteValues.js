const merge = (noteValues0, noteValues1) => {
    if (!noteValues0 || !noteValues1) {
        return noteValues0 || noteValues1 || {};
    }

    const noteValues = {};
    Object.keys(noteValues0).forEach((value) => {
        const noteKeys = new Set([
            ...noteValues0[value],
            ...(noteValues1[value] || []),
        ]);
        noteValues[value] = [...noteKeys];
    });
    Object.keys(noteValues1)
        .filter(value => !noteValues[value])
        .forEach((value) => {
            noteValues[value] = noteValues1[value];
        });

    return noteValues;
};

export default function mergeNoteValues(...noteValuesArr) {
    return noteValuesArr.reduce((accumNoteValues, noteValues) => merge(
        accumNoteValues,
        noteValues,
    ), {});
}
