export default function set(data) {
    return new Promise((resolve) => {
        resolve(Object.keys(data).forEach((key) => {
            localStorage.setItem(key, JSON.stringify(data[key]));
        }));
    });
}
