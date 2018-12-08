const BN = require('bn.js');
const chai = require('chai');

const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;

describe('bn128 precompute table single', () => {
    let precomputeTableSingle;
    before(() => {
        precomputeTableSingle = new Runtime('./easm_modules/precompute_table_single.easm');
    });

    it('macro PRECOMPUTE_TABLE_SINGLE correctly calculates precomputed table for one point', async () => {
        const point = bn128Reference.randomPoint();
        point.z = new BN(1);
        const { p } = bn128Reference;
        const { tables: [{ table, zFactors, tableZ }] } = bn128Reference.generateTable([point]);

        const reference = table.map(({ x, y, z }) => ({ x: x.fromRed(), y: y.fromRed(), z: z.fromRed() }));
        const dz = zFactors.map(z => z.fromRed());

        const { stack } = await precomputeTableSingle('PRECOMPUTE_TABLE_SINGLE', [point.z, point.x, bn128Reference.p, point.y]);
        for (let i = 0; i < reference.length; i += 1) {
            const stackIndex = (i * 8);
            const expected = reference[i];
            expect(expected.x.eq(stack[stackIndex].umod(p))).to.equal(true);
            expect((expected.y).eq(stack[stackIndex + 1].umod(p))).to.equal(true);
            if (i < reference.length - 1) {
                const u = dz[i];
                const zz = u.mul(u).umod(bn128Reference.p);
                const zzz = zz.mul(u).umod(bn128Reference.p);
                expect(stack[stackIndex + 2].eq(p)).to.equal(true);
                expect(stack[stackIndex + 3].umod(p).eq(zzz)).to.equal(true);
                expect(stack[stackIndex + 4].eq(p)).to.equal(true);
                expect(stack[stackIndex + 5].eq(p)).to.equal(true);
                expect(stack[stackIndex + 6].umod(p).eq(zz)).to.equal(true);
                expect(stack[stackIndex + 7].eq(p)).to.equal(true);
            }
        }
        const { x: x15, y: y15 } = reference[reference.length - 1];
        const z15 = tableZ;
        expect(stack[stack.length - 3].umod(p).eq(x15)).to.equal(true);
        expect(stack[stack.length - 2].umod(p).eq(p.sub(y15))).to.equal(true);
        expect(stack[stack.length - 1].umod(p).eq(z15)).to.equal(true);
        expect(stack.length === 59);
    });
});
