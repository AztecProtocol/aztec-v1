import query from '../utils/query';
import Web3Service from '../services/Web3Service';

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

    async grantAccess(address) {
        const {
            requestGrantAccess: {
                metadata,
                asset: {
                    address: zkAssetAddress,
                } = {},
            } = {},
        } = await query(`
            requestGrantAccess(noteId: "${this.id}", address: "${address}") {
                asset {
                    address
                }
                metadata
            }
        `) || {};

        let granted = false;
        if (metadata) {
            if (metadata.indexOf(address) > 0) {
                console.log(`Address '${address}' already has access to note '${this.id}'.`);
                return;
            }
            granted = await Web3Service
                .useContract('ZkAsset')
                .at(zkAssetAddress)
                .method('updateNoteMetaData')
                .send(
                    this.id,
                    metadata,
                );
        }

        if (granted) {
            console.log(`Successfully granted note access to ${address}`);
        } else {
            console.log(`Unable to grant permission of note '${this.id}' to '${address}'`);
        }
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
