/* eslint-disable no-bitwise */

export default function makeRand(seed, size = 4) {
    const randseeds = Array.from({ length: size }, () => 0);
    for (let i = 0; i < seed.length; i += 1) {
        randseeds[i % size] = (randseeds[i % size] << 5) - randseeds[i % size] + seed.charCodeAt(i);
    }

    return () => {
        const [firstSeed] = randseeds.splice(0, 1);
        const t = firstSeed ^ (firstSeed << 11);

        const lastSeed = randseeds[size - 1];
        const newSeed = lastSeed ^ (lastSeed >> 19) ^ t ^ (t >> 8);
        randseeds.push(newSeed);

        return (newSeed >>> 0) / ((1 << 31) >>> 0);
    };
}
