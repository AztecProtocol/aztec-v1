export default function randomInt(from = null, to = null, rand = Math.random) {
    const start = to !== null ? from : 0;
    let offset;
    if (to !== null) {
        offset = to - from;
    } else {
        offset = from !== null ? from : 2 ** 32;
    }
    return start + Math.floor(rand() * (offset + 1));
}

export const makeRandomInt = rand => (from, to) => randomInt(from, to, rand);
