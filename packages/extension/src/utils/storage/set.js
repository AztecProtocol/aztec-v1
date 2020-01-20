export default function set(data) {
    return new Promise((resolve) => {
        const valueMap = {};
        Object.keys(data).forEach((key) => {
            const value = JSON.stringify(data[key]);
            localStorage.setItem(key, value);
            valueMap[key] = value;
        });
        resolve(valueMap);
    });
}
