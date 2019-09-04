export default function randomInt(from = null, to = null) {
    const start = to !== null ? from : 0;
    let offset;
    if (to !== null) {
        offset = to - from;
    } else {
        offset = from !== null ? from : 2 ** 32;
    }
    return start + Math.floor(Math.random() * (offset + 1));
}
