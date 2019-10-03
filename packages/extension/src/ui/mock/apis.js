import {
    randomInt,
} from '~utils/random';
import sleep from '~utils/sleep';
import realApis from '~ui/apis';
import {
    addresses,
    assets,
    pastTransactions,
} from './data';

const mock = async (data) => {
    await sleep(randomInt(2000));
    const fakeData = {
        ...data,
        mock: true,
        timestamp: Date.now(),
    };
    return fakeData;
};

const mergeApis = (defaultApis, customApis = {}) => {
    const mockApis = {};
    Object.keys(defaultApis).forEach((name) => {
        if (typeof defaultApis[name] === 'object') {
            mockApis[name] = mergeApis(defaultApis[name], customApis[name]);
        } else {
            mockApis[name] = customApis[name] || mock;
        }
    });

    return mockApis;
};

export default mergeApis(realApis, {
    auth: {
        getCurrentUser: () => ({
            address: addresses[0],
        }),
    },
    asset: {
        getAssets: async () => assets,
        getPastTransactions: async (assetCode = '', count = 2) => {
            const transactions = !assetCode
                ? pastTransactions
                : pastTransactions
                    .filter(({ asset }) => asset.code === assetCode);

            return !count
                ? transactions
                : transactions.slice(0, count);
        },
    },
});
