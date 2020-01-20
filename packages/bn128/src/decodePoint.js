import mcl from './mcl/mcl';

export function serializePointForMcl(point) {
    const x = point.x.fromRed().toString(16);
    const y = point.y.fromRed().toString(16);
    // mcl serialized strings are formatted as a triplet of coordinates separated by spaces
    // format is 'z x y'
    return `1 ${x} ${y}`;
}

export function decode(gammaSerialized, gammaKSerialized, kMax) {
    return mcl.init(mcl.BN_SNARK1).then(() => {
        let accumulator = new mcl.G1();
        const gamma = new mcl.G1();
        const expected = new mcl.G1();
        accumulator.setStr(gammaSerialized, 16);
        gamma.setStr(gammaSerialized, 16);
        expected.setStr(gammaKSerialized, 16);
        let k = 1;
        while (k < kMax) {
            if (accumulator.isEqual(expected)) {
                break;
            }
            accumulator = mcl.add(accumulator, gamma);
            k += 1;
        }
        if (k === kMax) {
            throw new Error('could not find k!');
        }
        return k;
    });
}
