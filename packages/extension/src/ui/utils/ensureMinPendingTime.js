export default function ensureMinPendingTime(callback, pendingTime = 500) {
    const start = Date.now();
    return () => {
        const diff = Math.max(0, pendingTime - (Date.now() - start));
        setTimeout(() => callback(), diff);
    };
}
