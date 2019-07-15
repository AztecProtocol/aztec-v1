import query from '../utils/query';
// import notePicker from '../utils/notePicker';

export default class Asset {
    constructor({
        id,
    } = {}) {
        this.id = id;
        this.staticProperty = [
            'balance',
            'balance',
        ];
    }

    refresh = async () => {
        const response = await query(`
            asset(id: "${this.id}") {
                balance
                owner
                publicKey
                hash
                viewingKey
            }
        `);
        const data = (response && response.asset) || {};
        this.staticProperty.forEach((key) => {
            this[key] = data[key];
        });
    };

    deposit = () => {

    };

    createNoteFromBalance = ({ value, access }) => {
        // to pick a note we need to do the following
        // 1. split the expected note value into a normally distributed array of buckets that sum to > than the note
        // value
        // minimise the notes used
        // itterate until we have 5 solutions
        // score each solution
        getDistribution(value);
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
