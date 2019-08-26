import noteModel from '~background/database/models/note';

export default async function createNote(note) {
    
    const id = await noteModel.add(note);

    return {
        id
    }
}