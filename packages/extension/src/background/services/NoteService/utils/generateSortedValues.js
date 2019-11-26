export default function generateSortedValues(noteValues) {
    const values = [];
    let size = 0;
    Object.keys(noteValues).forEach((value) => {
        const numberOfNotes = noteValues[value].length;
        values.length += numberOfNotes;
        values.fill(+value, size);
        size += numberOfNotes;
    });

    return values.sort((a, b) => a - b);
}
