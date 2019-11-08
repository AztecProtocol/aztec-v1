import pickNoteWithValue from './pickNoteWithValue';
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
    if (typeof equalTo === 'number') {
        return pickNoteWithValue({
            noteValues,
            value: equalTo,
            numberOfNotes,
            allowLessNumberOfNotes,
        });
    }

    const validNoteValues = getNoteValuesInRange({
        noteValues,
        greaterThan,
        lessThan,
    });

    return pickNotesFromNoteValues({
        noteValues: validNoteValues,
        numberOfNotes,
        allowLessNumberOfNotes,
    });
}
