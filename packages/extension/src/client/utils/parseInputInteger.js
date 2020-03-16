export default function parseInputInteger(val) {
    if (typeof val === 'string') {
        if (val === '') {
            return undefined;
        }
        if (val.trim().match(/^[0-9]{1,}$/)) {
            return parseInt(val, 10);
        }
    }

    return val;
}
