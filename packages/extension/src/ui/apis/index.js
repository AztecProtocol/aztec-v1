import {
    randomInt,
} from '~utils/random';
import sleep from '~utils/sleep';
import * as auth from './auth';

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
    ...auth,
};
