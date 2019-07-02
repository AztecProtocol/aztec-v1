import fetchFromContentScript from '../utils/fetchFromContentScript';

export default {
    balance: async (assetId = '') => fetchFromContentScript({
        query: `
            asset(id: "${assetId}") {
                balance
            }
        `,
    }),
};
