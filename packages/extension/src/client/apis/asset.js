import query from '../utils/query';

export default class Asset {
    constructor({
        id,
    } = {}) {
        this.id = id;
        this.staticProperty = [
            'balance',
        ];
    }

    refresh = async () => {
        const response = await query(`
            asset(id: "${this.id}") {
                balance
            }
        `);
        const data = (response && response.asset) || {};
        this.staticProperty.forEach((key) => {
            this[key] = data[key];
        });
    };

    deposit = () => {
        console.log('deposit');
    };
}

export const assetFactory = async (assetId) => {
    const asset = new Asset({
        query,
        id: assetId,
    });
    await asset.refresh();

    return asset;
};
