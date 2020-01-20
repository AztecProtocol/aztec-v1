import {
    randomInt,
} from '~/utils/random';
import sleep from '~/utils/sleep';
import * as account from './account';
import * as ace from './ace';
import * as asset from './asset';
import * as auth from './auth';
import note from './note';
import * as proof from './proof';

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
    account,
    ace,
    asset,
    auth,
    note,
    proof,
};
