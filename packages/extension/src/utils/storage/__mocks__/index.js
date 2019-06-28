let db = {};

const get = (keys) => {
    if (typeof keys === 'string') {
        return db[keys];
    }

    const result = {};
    keys.forEach((key) => {
        result[key] = db[key];
    });

    return result;
};

const set = (valueMap) => {
    Object.keys(valueMap).forEach((key) => {
        db[key] = valueMap[key];
    });
};

const reset = () => {
    db = {};
};

export {
    get,
    set,
    reset,
};
