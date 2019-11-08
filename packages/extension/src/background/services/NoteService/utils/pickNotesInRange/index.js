import getNoteValuesInRange from './getNoteValuesInRange';
import pickNotesFromNoteValues from './pickNotesFromNoteValues';

export default function pickNotesInRange({
    noteValues,
    equalTo,
    greaterThan,
    lessThan,
    numberOfNotes,
    allowLessNumberOfNotes,
}) {
    let validNoteValues;
    if (typeof equalTo === 'number') {
        if (!noteValues[equalTo]) {
            return [];
        }
        validNoteValues = {
            [equalTo]: noteValues[equalTo],
        };
    } else {
        validNoteValues = getNoteValuesInRange({
            noteValues,
            greaterThan,
            lessThan,
        });
    }

    return pickNotesFromNoteValues({
        noteValues: validNoteValues,
        numberOfNotes,
        allowLessNumberOfNotes,
    });
}
