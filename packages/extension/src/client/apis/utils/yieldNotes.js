import noteFactory from '../noteFactory';

export default async function yieldNotes(cb, ...params) {
    const notes = await cb(...params);
    if (!notes) {
        return null;
    }

    return Promise.all(notes.map(({ noteHash }) => noteFactory(noteHash)));
}
