import sleep from '~utils/sleep';

const db = {};

const mockDb = {
    get: async (keys) => {
        await sleep(10);

        if (typeof keys === 'string') {
            return db[keys];
        }

        const result = {};
        keys.forEach((key) => {
            result[key] = db[key];
        });

        return result;
    },
    set: async (valueMap) => {
        await sleep(10);

        Object.keys(valueMap).forEach((key) => {
            db[key] = valueMap[key];
        });
        return valueMap;
    },
};

export default {
    local: mockDb,
    sync: mockDb,
    onChanged: {
        addListener: () => {},
    },
};
