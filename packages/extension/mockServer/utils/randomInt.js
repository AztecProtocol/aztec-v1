export default function randomInt(from, to = null) {
    const start = to !== null ? from : 0;
    const offset = to !== null ? to - from : from;
    return start + Math.floor(Math.random() * (offset + 1));
}
