import randomInt from './randomInt';

export default function randomSumArray(sum, arraySize = 1, rand = Math.random) {
    if (arraySize <= 0) {
        return [];
    }

    const sumArr = [sum];
    for (let i = 0; i < arraySize - 1; i += 1) {
        const pick = randomInt(0, sumArr.length - 1, rand);
        const val = sumArr.splice(pick, 1);
        const splitVal = randomInt(0, val, rand);
        sumArr.push(splitVal, val - splitVal);
    }

    return sumArr;
}

export const makeRandomSumArray = rand => (sum, arraySize) => makeRandomSumArray(
    sum,
    arraySize,
    rand,
);
