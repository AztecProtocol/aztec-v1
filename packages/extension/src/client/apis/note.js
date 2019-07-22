import Web3Service from '../services/Web3Service';
import query from './utils/query';
import ApiError from './utils/ApiError';

const dataProperties = [
    'value',
    'owner',
];

export default class Note {
    constructor({
        id,
    } = {}) {
        this.id = id;
    }

    refresh = async () => {
        const {
            noteResponse,
        } = await query(`
            noteResponse: note(id: "${this.id}") {
                note {
                    value
                    owner {
                        address
                    }
                    asset {
                        balance
                    }
                }
                error {
                    type
                    key
                    message
                    response
                }
            }
        `) || {};

        const {
            note,
        } = noteResponse || {};
        if (note) {
            dataProperties.forEach((key) => {
                this[key] = note[key];
            });
        }
    };

    async grantAccess(addresses) {
        const addressList = typeof addresses === 'string'
            ? [addresses]
            : addresses;

        const {
            response,
        } = await query(`
            response: grantNoteAccessPermission(noteId: "${this.id}", address: "${addressList.join('')}") {
                permission {
                    metadata
                    prevMetadata
                    asset {
                        address
                    }
                }
                error {
                    type
                    key
                    message
                    response
                }
            }
        `);

        const {
            permission,
        } = response;
        const {
            metadata,
            prevMetadata,
            asset,
        } = permission || {};
        let updated = false;
        if (metadata
            && metadata !== prevMetadata
        ) {
            const {
                address: zkAssetAddress,
            } = asset;
            try {
                await Web3Service
                    .useContract('ZkAsset')
                    .at(zkAssetAddress)
                    .method('updateNoteMetaData')
                    .send(
                        this.id,
                        metadata,
                    );
            } catch (e) {
                throw new ApiError(e);
            }
            updated = true;
        }

        return updated;
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
