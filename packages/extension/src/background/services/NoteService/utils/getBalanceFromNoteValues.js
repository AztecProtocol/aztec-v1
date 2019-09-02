export default function getBalanceFromNoteValues(noteValues = {}) {
    return Object.keys(noteValues)
        .reduce((accum, value) => {
            const numberOfNotes = noteValues[value].length;
            return accum + (value * numberOfNotes);
        }, 0);
}
