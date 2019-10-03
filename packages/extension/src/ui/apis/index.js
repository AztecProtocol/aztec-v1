import {
    randomInt,
} from '~utils/random';
import sleep from '~utils/sleep';
import * as auth from './auth';
import * as asset from './asset';
import deposit from './deposit';

export default {
    mock: async (data) => {
        await sleep(randomInt(2000));
        const fakeData = {
            ...data,
            mock: true,
            timestamp: Date.now(),
        };
        return fakeData;
    },
    auth,
    asset,
    deposit,
};
