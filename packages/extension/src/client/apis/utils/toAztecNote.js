import {
    note as noteUtils,
} from 'aztec.js';

export default async function toAztecNote(note) {
    if (note instanceof noteUtils.Note) {
        return note;
    }
    if ('export' in note
        && note.isValid()
    ) {
        return note.export();
    }

    return null;
}
