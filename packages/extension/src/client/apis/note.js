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
                asset {
                    balance
                }
            }
        `);
        const data = (response && response.note) || {};
        this.staticProperty.forEach((key) => {
            this[key] = data[key];
        });
    };

    async grantAccess(address) {
        let granted = false;
        let errorMessage;

        const {
            requestGrantAccess: {
                metadata,
                prevMetadata,
                asset,
                error,
            } = {},
        } = await query(`
            requestGrantAccess(noteId: "${this.id}", address: "${address}") {
                metadata
                prevMetadata
                asset {
                    address
                }
                error {
                    message
                }
            }
        `) || {};

        if (error) {
            errorMessage = error.message;
        } else if (metadata && metadata !== prevMetadata) {
            const {
                address: zkAssetAddress,
            } = asset;
            try {
                granted = await Web3Service
                    .useContract('ZkAsset')
                    .at(zkAssetAddress)
                    .method('updateNoteMetaData')
                    .send(
                        this.id,
                        metadata,
                    );
            } catch (e) {
                errorMessage = e;
            }
        }

        if (errorMessage) {
            console.log(errorMessage);
        } else if (granted) {
            console.log(`Successfully granted access of note '${this.id}' to address '${address}'`);
        } else {
            console.log(`Address '${address}' already has access to note '${this.id}'.`);
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
