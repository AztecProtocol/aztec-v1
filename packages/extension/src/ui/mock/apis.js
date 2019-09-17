import {
    randomInt,
} from '~utils/random';
import sleep from '~utils/sleep';
import {
    assets,
    pastTransactions,
} from './data';

export default {
    mock: async (data, cb) => {
        await sleep(randomInt(2000));
        const fakeData = {
            ...data,
            mock: true,
            timestamp: Date.now(),
        };
        cb(fakeData);
    },
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
