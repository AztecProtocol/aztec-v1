import query from '../utils/query';
// import notePicker from '../utils/notePicker';

const dataProperties = [
    'address',
    'balance',
];

export default class Asset {
    constructor({
        id,
    } = {}) {
        this.id = id;
    }

    isValid() {
        return !!this.address;
    }

    refresh = async () => {
        const {
            assetResponse,
        } = await query(`
            assetResponse: asset(id: "${this.id}") {
                asset {
                    address
                    balance
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
            asset,
        } = assetResponse || {};
        if (asset) {
            dataProperties.forEach((key) => {
                this[key] = asset[key];
            });
        }
    };

    deposit = () => {

    };

    createNoteFromBalance = async ({
        amount,
        userAccess = [],
        owner = '',
    }) => {
        const {
            newNote,
        } = await query(`
            newNote: createNoteFromBalance(
                assetId: "${this.id}",
                amount: ${amount},
                owner: "${owner}",
                userAccess: "${userAccess.join('')}"
            ) {
                note {
                    hash
                    value
                    viewingKey
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

        return newNote;
    };
}

export const assetFactory = async (assetId) => {
    const asset = new Asset({
        id: assetId,
    });
    await asset.refresh();

    return asset;
};
