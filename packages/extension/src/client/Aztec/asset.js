import fetchFromContentScript from '../utils/fetchFromContentScript';

export default {
    balance: async (assetId = 'abc') => fetchFromContentScript({
        query: `
            asset(id: "${assetId}") {
                balance
            }
        `,
    }),
};
