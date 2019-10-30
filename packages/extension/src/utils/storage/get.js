const parseValue = (val) => {
    let obj;
    try {
        obj = JSON.parse(val);
    } catch (e) {
        obj = null;
    }

    return obj;
};

export default function get(keys) {
    const isSingleRequest = typeof keys === 'string';
    const keyArr = isSingleRequest
        ? [keys]
        : keys;

    const values = {};
    keyArr.forEach((key) => {
        const val = localStorage.getItem(key);
        values[key] = parseValue(val);
    });

    return isSingleRequest
        ? values[keys]
        : values;
}
