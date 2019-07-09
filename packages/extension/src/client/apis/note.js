import query from '../utils/query';

export default class Note {
    constructor({
        id,
    } = {}) {
        this.id = id;

        this.staticProperty = [
            'value',
            'owner',
        ];
    }

    refresh = async () => {
        const response = await query(`
            note(id: "${this.id}") {
                value
                owner {
                    address
                }
            }
        `);
        const data = (response && response.note) || {};
        this.staticProperty.forEach((key) => {
            this[key] = data[key];
        });
    };

    grantAccess() {
        console.log('grantAccess', this.id);
    }
}

export const noteFactory = async (noteId) => {
    const note = new Note({
        query,
        id: noteId,
    });
    await note.refresh();

    return note;
};
