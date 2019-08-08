import aztec from 'aztec.js';

export default async function toAztecNote(note) {
    if (note instanceof aztec.note.Note) {
        return note;
    }
    if ('export' in note) {
        return note.export();
    }

    return null;
}
