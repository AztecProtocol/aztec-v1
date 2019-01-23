const chai = require('chai');

const bn128 = require('./bn128_reference');
const wnafReference = require('./wnaf');
const endomorphism = require('./endomorphism');

const { expect } = chai;

describe('wnaf tests', () => {
    it('wnaf works', () => {
        const scalar = bn128.randomScalar();
        const wnaf = wnafReference.wnaf(scalar);
        const result = wnafReference.recoverWnaf(wnaf);
        expect(result.eq(scalar)).to.equal(true);
    });

    it('average number of nonzero wnaf entries for bn128 group scalar is 42.6', () => {
        let result = 0;
        for (let i = 0; i < 10000; i += 1) {
            const scalar = bn128.randomScalar();
            const wnaf = wnafReference.wnaf(scalar);
            const count = wnafReference.countNonzeroEntries(wnaf);
            result += count;
        }
        result /= 10000;
        const rounded = Math.round((result * 10) - 427) / 10;
        expect(rounded < 0.5).to.equal(true);
        expect(rounded > -0.5).to.equal(true);
    });

    it('for bn256 group scalar, hardcoding 43 iterations of WNAF_SLICE has lowest gas cost', () => {
        const frequencies = new Array(50).fill(0);
        let max = 0;
        for (let i = 0; i < 10000; i += 1) {
            const scalar = bn128.randomScalar();
            const wnaf = wnafReference.wnaf(scalar);
            const count = wnafReference.countNonzeroEntries(wnaf);
            frequencies[count] += 1;
            max = Math.max(max, count);
        }
        const probabilities = frequencies.map(f => f / 10000);

        const conditionalCost = 23;
        const wnafSliceCost = 69;

        const costTable = new Array(max).fill(0).map((x, j) => {
            const gasCosts = probabilities.reduce((acc, prob, index) => {
                if (index >= j) {
                    const jumpCost = (index - j) * conditionalCost;
                    const wnafCost = wnafSliceCost * index;
                    const total = prob * (jumpCost + wnafCost);
                    return acc + total;
                }
                const total = prob * (wnafSliceCost * j);
                return acc + total;
            }, 0);
            return gasCosts;
        });
        const targetCost = Math.min(...costTable);
        const targetIndex = costTable.indexOf(targetCost);
        console.log('minima with conditional test at j = ', targetIndex);
        console.log('expected gas cost (sans memory costs) = ', targetCost);
        expect(targetIndex).to.equal(42);
    });

    it('for 127-bit endomorphism scalars, hardcoding 22 iterations of WNAF_SLICE has lowest gas cost', () => {
        const frequencies = new Array(50).fill(0);
        let max = 0;

        const wnafs = [];
        for (let i = 0; i < 5000; i += 1) {
            const { k1, k2 } = endomorphism.endoSplit(bn128.randomScalar());
            wnafs.push(wnafReference.wnaf(k1));
            wnafs.push(wnafReference.wnaf(k2));
        }

        wnafs.forEach((wnaf) => {
            const count = wnafReference.countNonzeroEntries(wnaf);
            frequencies[count] += 1;
            max = Math.max(max, count);
        });
        const probabilities = frequencies.map(f => f / 10000);

        const conditionalCost = 23;
        const wnafSliceCost = 69;

        const costTable = new Array(max).fill(0).map((x, j) => {
            const gasCosts = probabilities.reduce((acc, prob, index) => {
                if (index >= j) {
                    const jumpCost = (index - j) * conditionalCost;
                    const wnafCost = wnafSliceCost * index;
                    const total = prob * (jumpCost + wnafCost);
                    return acc + total;
                }
                const total = prob * (wnafSliceCost * j);
                return acc + total;
            }, 0);
            return gasCosts;
        });
        const targetCost = Math.min(...costTable);
        const targetIndex = costTable.indexOf(targetCost);
        console.log('minima with conditional test at j = ', targetIndex);
        console.log('expected gas cost (sans memory costs) = ', targetCost);
        expect(targetIndex).to.equal(21);
    });
});
