const chai = require('chai');

const bn128 = require('./bn128_reference');
const endomorphism = require('./endomorphism');

const { lambda, n } = endomorphism;
const { expect } = chai;

describe('endomorphism tests', () => {
    it.only('endomorphism.endoSplit correctly decomposes bn128 scalar', () => {
        let average = 0;
        const max = 10;
        for (let i = 0; i < max; i += 1) {
            console.log('i = ', i);
            const scalar = bn128.randomScalar();
            const { k1, k2 } = endomorphism.endoSplit(scalar);
            expect(k1.add(k2.neg().mul(lambda).umod(n)).toString(16)).to.equal(scalar.toString(16));
            expect(k1.bitLength() <= 127).to.equal(true);
            expect(k2.bitLength() <= 127).to.equal(true);
            average += (k1.bitLength() + k2.bitLength());
        }
        console.log('average length = ', average / (max * 2));
    }).timeout(1000000);

    it('shifted basis scalars are correctly represented', () => {
        const { g1, g2 } = endomorphism.getShiftedBasis();
        expect(g1.toString(16)).to.equal(endomorphism.g1.toString(16));
        expect(g2.toString(16)).to.equal(endomorphism.g2.toString(16));
    });
});
