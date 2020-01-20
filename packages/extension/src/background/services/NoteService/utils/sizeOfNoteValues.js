export default function sizeOfNoteValues(noteValues) {
    let size = 0;
    Object.values(noteValues)
        .forEach((notes) => {
            size += notes.length;
        });

    return size;
}
