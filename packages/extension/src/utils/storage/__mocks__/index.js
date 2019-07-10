import lock, {
    onIdle,
} from '../lock';

let db = {};

const get = (keys) => {
    if (keys === undefined) {
        return db;
    }

    if (typeof keys === 'string') {
        return db[keys];
    }

    const result = {};
    keys.forEach((key) => {
        result[key] = db[key];
    });

    return result;
};

const remove = (keys) => {
    if (keys === undefined) {
        return db;
    }

    if (typeof keys === 'string') {
        return delete db[keys];
    }

    keys.forEach((key) => {
        delete db[key];
    });

    return db;
};

const set = (valueMap) => {
    Object.keys(valueMap).forEach((key) => {
        db[key] = valueMap[key];
    });
    return valueMap;
};

const reset = () => {
    db = {};
};

export {
    get,
    set,
    lock,
    remove,
    onIdle,
    reset,
};
