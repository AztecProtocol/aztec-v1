export default function get(keys) {
    if (typeof keys === 'string') {
        const value = localStorage.getItem(keys);
        return value ? JSON.parse(value) : null;
    }
    return new Promise((resolve) => {
        resolve(keys.reduce((obj, str) => {
            const value = localStorage.getItem(str);
            obj[str] = value ? JSON.parse(value) : null;
            return obj;
        }, {}));
    });
}
