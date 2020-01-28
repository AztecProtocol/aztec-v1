import randomInt from './randomInt';

const pick = (count, start, end, rand) => {
    if (count <= 0 || end < start) {
        return [];
    }

    const mid = randomInt(start, end, rand);
    if (count === 1) {
        return [mid];
    }

    const leftLen = mid - start;
    const rightLen = end - mid;
    const len = end - start;
    let leftCount = Math.round(((count - 1) * leftLen) / len);
    let rightCount = count - leftCount - 1;
    leftCount += Math.max(0, Math.max(0, rightCount - rightLen));
    rightCount += Math.max(0, Math.max(0, leftCount - leftLen));

    return [
        ...pick(leftCount, start, mid - 1, rand),
        mid,
        ...pick(rightCount, mid + 1, end, rand),
    ];
};

export default function randomInts(count, from = null, to = null, rand = Math.random) {
    const pivot = to !== null ? from : 0;
    let offset;
    if (to !== null) {
        offset = to - from;
    } else {
        offset = from !== null ? from : 2 ** 32;
    }
    const [start, end] = offset >= 0
        ? [pivot, pivot + offset]
        : [pivot + offset, pivot];

    return pick(count, start, end, rand);
}

export const makeRandomInts = rand => (count, from, to) => randomInts(count, from, to, rand);
