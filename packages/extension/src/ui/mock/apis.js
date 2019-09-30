import {
    randomInt,
} from '~utils/random';
import sleep from '~utils/sleep';
import realApis from '~ui/apis';
import {
    assets,
    pastTransactions,
} from './data';

const mock = async (data, cb) => {
    await sleep(randomInt(2000));
    const fakeData = {
        ...data,
        mock: true,
        timestamp: Date.now(),
    };
    cb(fakeData);
};

const mockApis = {};
Object.keys(realApis).forEach((apiName) => {
    mockApis[apiName] = mock;
});

export default {
    ...mockApis,
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
};
