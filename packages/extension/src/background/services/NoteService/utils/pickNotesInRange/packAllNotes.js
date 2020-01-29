export default function packAllNotes(noteValues) {
    const noteKeyData = [];
    Object.keys(noteValues).forEach((value) => {
        noteValues[value].forEach((key) => {
            noteKeyData.push({
                value,
                key,
            });
        });
    });

    return noteKeyData;
}
