import query from './utils/query';
// import notePicker from '../utils/notePicker';

const dataProperties = [
    'balance',
];

export default class Asset {
    constructor({
        id,
    } = {}) {
        this.id = id;
    }

    refresh = async () => {
        const {
            assetResponse,
        } = await query(`
            assetResponse: asset(id: "${this.id}") {
                asset {
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

    createNoteFromBalance = (
        // { value, access }
    ) => {
        // to pick a note we need to do the following
        // 1. split the expected note value into a normally distributed array of buckets that sum to > than the note
        // value
        // minimise the notes used
        // itterate until we have 5 solutions
        // score each solution
        // getDistribution(value);
    }
}

export const assetFactory = async (assetId) => {
    const asset = new Asset({
        query,
        id: assetId,
    });
    await asset.refresh();

    return asset;
};
