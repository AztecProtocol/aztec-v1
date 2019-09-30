export default function closeWindow(delay = 0) {
    if (!delay) {
        window.close();
        return;
    }
    setTimeout(() => {
        window.close();
    }, delay);
}
