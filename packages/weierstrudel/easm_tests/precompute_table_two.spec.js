const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');
const chai = require('chai');
const BN = require('bn.js');

const { p, beta } = bn128Reference;
const { expect, assert } = chai;

function sliceMemory(memArray, numWords) {
    if (memArray.length !== numWords*32) {
        throw new Error(`memory legth ${memArray.length} does not map to ${numWords} words (${numWords*32})`);
    }
    const result = [];
    for (let i = 0; i < numWords * 32; i += 32) {
        result.push(new BN(memArray.slice(i, i + 32), 16));
    }
    return result;
}

function splitPoint(x, y) {
    return {
        x,
        xEndo: x.mul(beta).umod(p),
        y,
        yNeg: p.sub(y),
    };
}

const helperMacros = `
#include "./easm_modules/precompute_table.easm"
#define RESCALE_15_WRAPPER = takes(3) returns(0) {
    RESCALE_15<dup3,dup2,0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define RESCALE_13_WRAPPER = takes(7) returns(0) {
    RESCALE_13<dup4,0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define RESCALE_WRAPPER = takes(11) returns(0) {
    RESCALE<dup4,0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define RESCALE_15_TRANSITION_WRAPPER = takes(5) returns(0) {
    RESCALE_15_TRANSITION<0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}
/*#define RESCALE_ITERATION_WRAPPER = takes(59) returns(0) {
    RESCALE_15<dup3,0x2c0,0x2e0,0x300,0x320,0xac0,0xae0,0xb00,0xb20>()
    RESCALE_13<dup4,0x280,0x2a0,0x340,0x360,0xa80,0xaa0,0xb40,0xb60>()
    RESCALE<dup4,0x240,0x260,0x380,0x3a0,0xa40,0xa60,0xb80,0xba0>()
    RESCALE<dup4,0x200,0x220,0x3c0,0x3e0,0xa00,0xa20,0xbc0,0xbe0>()
    RESCALE<dup4,0x1c0,0x1e0,0x400,0x420,0x9c0,0x9e0,0xc00,0xc20>()
    RESCALE<dup4,0x180,0x1a0,0x440,0x460,0x980,0x9a0,0xc40,0xc60>()
    RESCALE<dup4,0x140,0x160,0x480,0x4a0,0x940,0x960,0xc80,0xca0>()
    RESCALE<dup6,0x100,0x120,0x4c0,0x4e0,0x900,0x920,0xcc0,0xce0>()
}*/
`;

describe('bn128 precompute table two', () => {
    let precomputeTable;
    let templateWrapper;
    before(() => {
        precomputeTable = new Runtime('./easm_modules/precompute_table.easm');
        templateWrapper = new Runtime(helperMacros);
    });

    it('macro RESCALE_15 correctly performs point rescaling', async () => {
        const input = bn128Reference.randomPoint();
        const { stack, memory } = await templateWrapper(
            'RESCALE_15_WRAPPER',
            [p, input.x, input.y]
        );
        const expected = splitPoint(input.x, input.y);
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.y)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.yNeg)).to.equal(true);
        expect(stack.length).to.equal(1);
        expect(stack[0].eq(p)).to.equal(true);
    });

    it('macro RESCALE_13 correctly performs point rescaling', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await templateWrapper(
            'RESCALE_13_WRAPPER',
            [p, p1.x, p1.y, p, dz3[0], p, dz2[0]],
        );
        //             [ p, p1.x, p1.y, p, dz3[1], p, dz2[1], dz3[0], dz2[0]],
        const expected = splitPoint(
            p1.x.mul(dz2[0]).umod(p),
            p1.y.mul(dz3[0]).umod(p),
        );
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.y)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.yNeg)).to.equal(true);
        expect(stack.length).to.equal(3);
        expect(stack[0].eq(p)).to.equal(true);
        expect(stack[1].eq(dz2[0])).to.equal(true);
        expect(stack[2].eq(dz3[0])).to.equal(true);
    });

    it('macro RESCALE correctly performs point rescaling', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await templateWrapper(
            'RESCALE_WRAPPER',
            [p, p1.x, p1.y, p, dz3[0], p, p, dz2[0], p, dz2[1], dz3[1]],
        );
        const expected = splitPoint(
            p1.x.mul(dz2[0].mul(dz2[1]).umod(p)).umod(p),
            p1.y.mul(dz3[0].mul(dz3[1]).umod(p)).umod(p),
        );
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.y)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.yNeg)).to.equal(true);
        expect(stack.length).to.equal(3);
        expect(stack[0].eq(p)).to.equal(true);
        expect(stack[1].eq(dz2[0].mul(dz2[1]).umod(p))).to.equal(true);
        expect(stack[2].eq(dz3[0].mul(dz3[1]).umod(p))).to.equal(true);
    });

    it('macro RESCALE_15_TRANSITION correctly rescales x,y coordinates of new table entry on stack', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await templateWrapper(
            'RESCALE_15_TRANSITION_WRAPPER',
            [p, p1.x, p1.y, dz2[0], dz3[0]],
        );
        const expected = splitPoint(
            p1.x.mul(dz2[0]).umod(p),
            p1.y.mul(dz3[0]).umod(p),
        );
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.y)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.yNeg)).to.equal(true);
        expect(stack.length).to.equal(3);
        expect(stack[0].eq(p)).to.equal(true);
        expect(stack[1].eq(dz2[0])).to.equal(true);
        expect(stack[2].eq(dz3[0])).to.equal(true);
    });

    it('macro PRECOMPUTE_TABLE_SINGLE_AFFINE correctly calculates coordinates and scaling factors for an affine point', async() => {
        const { x, y } = bn128Reference.randomPoint();
        const { p } = bn128Reference;
        const reference = bn128Reference.generateTableSingle(x, y, new BN(1));
        const { stack } = await precomputeTable('PRECOMPUTE_TABLE_SINGLE_AFFINE', [x, y]);
        for (let i = 0; i < reference.p.length; i += 1) {
            const stackIndex = (i*8);
            const expected = reference.p[i];
            expect(expected.x.eq(stack[stackIndex].umod(p))).to.equal(true);
            expect(p.sub(expected.y).eq(stack[stackIndex+1].umod(p))).to.equal(true);
            if (i < reference.p.length - 1) {
                const u = reference.dz[i];
                const zz = u.mul(u).umod(bn128Reference.p);
                const zzz = zz.mul(u).umod(bn128Reference.p); 
                expect(stack[stackIndex+2].eq(p)).to.equal(true);
                expect(stack[stackIndex+3].umod(p).eq(zzz)).to.equal(true);
                expect(stack[stackIndex+4].eq(p)).to.equal(true);
                expect(stack[stackIndex+5].eq(p)).to.equal(true);
                expect(stack[stackIndex+6].umod(p).eq(zz)).to.equal(true);
                expect(stack[stackIndex+7].eq(p)).to.equal(true);
            }
        }
        const { x: x15, y: y15, z: z15 } = reference.p[reference.p.length - 1];
        expect(stack[stack.length - 3].umod(p).eq(x15)).to.equal(true);
        expect(stack[stack.length - 2].umod(p).eq(p.sub(y15))).to.equal(true);
        expect(stack[stack.length - 1].umod(p).eq(z15)).to.equal(true);
        expect(stack.length === 59);
    });


    it('macro PRECOMPUTE_TABLE_SINGLE_AFFINE_FINAL correctly calculates coordinates and scaling factors for an affine point', async() => {
        const { x, y } = bn128Reference.randomPoint();
        const { p } = bn128Reference;
        const reference = bn128Reference.generateTableSingle(x, y, new BN(1));
        const { stack } = await precomputeTable('PRECOMPUTE_TABLE_SINGLE_AFFINE_FINAL', [x, y]);
        for (let i = 0; i < reference.p.length - 1; i += 1) {
            const stackIndex = (i*8);
            const expected = reference.p[i];
            expect(expected.x.eq(stack[stackIndex].umod(p))).to.equal(true);
            expect(p.sub(expected.y).eq(stack[stackIndex+1].umod(p))).to.equal(true);
            if (i < reference.p.length - 2) {
                const u = reference.dz[i];
                const zz = u.mul(u).umod(bn128Reference.p);
                const zzz = zz.mul(u).umod(bn128Reference.p); 
                expect(stack[stackIndex+2].eq(p)).to.equal(true);
                expect(stack[stackIndex+3].umod(p).eq(zzz)).to.equal(true);
                expect(stack[stackIndex+4].eq(p)).to.equal(true);
                expect(stack[stackIndex+5].eq(p)).to.equal(true);
                expect(stack[stackIndex+6].umod(p).eq(zz)).to.equal(true);
                expect(stack[stackIndex+7].eq(p)).to.equal(true);
            }
        }
        const { x: x15, y: y15, z: z15 } = reference.p[reference.p.length - 1];
        const u = reference.dz[reference.dz.length - 1];
        const zz = u.mul(u).umod(bn128Reference.p);
        const zzz = zz.mul(u).umod(bn128Reference.p);
        expect(stack[stack.length - 8].eq(p)).to.equal(true);
        expect(stack[stack.length - 7].umod(p).eq(zzz)).to.equal(true);
        expect(stack[stack.length - 6].eq(p)).to.equal(true);
        expect(stack[stack.length - 5].umod(p).eq(zz)).to.equal(true);
        expect(stack[stack.length - 4].umod(p).eq(x15)).to.equal(true);
        expect(stack[stack.length - 3].umod(p).eq(p.sub(y15))).to.equal(true);
        expect(stack[stack.length - 2].eq(p)).to.equal(true);
        expect(stack[stack.length - 1].umod(p).eq(z15)).to.equal(true);
        expect(stack.length === 59);
    });

    it('macro PRECOMPUTE_TABLE_ONE correctly calculates precomputed table for one point', async () => {
        const p1 = bn128Reference.randomPoint();
        inputReference = [{ x: p1.x, y: p1.y }];
        const { referenceTable, globalZ } = bn128Reference.generateTableMultiple(inputReference);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_ONE', [], [], [
            { index: 0, value: p1.x },
            { index: 32, value: p1.y },
        ]);
        const result = sliceMemory(memory, 72);
        const baseMem = result.slice(0, 8);
        const baseTable = result.slice(8, 40);
        const endoTable = result.slice(40, 72);
        expect(baseTable.length).to.equal(32);
        expect(endoTable.length).to.equal(32);
        expect(baseMem[3].umod(p).eq(globalZ)).to.equal(true);
        const zz = globalZ.mul(globalZ).umod(p);
        const zzz = zz.mul(globalZ).umod(p);
        expect(stack.length).to.equal(2);
        for (let i  = 0; i < baseTable.length; i += 32) {
            const expected = referenceTable.slice(i/2, 8);
            for (let j = 0; j < 8; j += 2) {
                expect(baseTable[i+j].umod(p).eq(expected[j/2].x)).to.equal(true);
                expect(baseTable[i+j+1].umod(p).eq(p.sub(expected[j/2].y))).to.equal(true);
                expect(baseTable[i+32-j-2].umod(p).eq(expected[j/2].x)).to.equal(true);
                expect(baseTable[i+32-j-1].umod(p).eq(expected[j/2].y)).to.equal(true);
                expect(endoTable[i+j].umod(p).eq(beta.mul(expected[j/2].x).umod(p))).to.equal(true);
                expect(endoTable[i+j+1].umod(p).eq(p.sub(expected[j/2].y))).to.equal(true);
                expect(endoTable[i+32-j-2].umod(p).eq(beta.mul(expected[j/2].x).umod(p))).to.equal(true);
                expect(endoTable[i+32-j-1].umod(p).eq(expected[j/2].y)).to.equal(true);
            }
        }
    });

    it('macro PRECOMPUTE_TABLE_TWO correctly calculates precomputed table for two points', async () => {
        const p1 = bn128Reference.randomPoint();
        const p2 = bn128Reference.randomPoint();
        const inputReference = [{ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y }];
        const { referenceTable, globalZ } = bn128Reference.generateTableMultiple(inputReference);
        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_TWO', [], [], [
            { index: 0, value: p1.x },
            { index: 32, value: p1.y },
            { index: 64, value: p2.x },
            { index: 96, value: p2.y },
        ]);
        const result = sliceMemory(memory, 136);
        const baseMem = result.slice(0, 8);
        const baseTable = result.slice(8, 72);
        const endoTable = result.slice(72, 136);
        expect(baseTable.length).to.equal(64);
        expect(endoTable.length).to.equal(64);
        expect(baseMem[3].umod(p).eq(globalZ)).to.equal(true);
        expect(stack.length).to.equal(2);
        for (let i  = 0; i < baseTable.length; i += 32) {
            const expected = referenceTable.slice(i/4, (i/4) + 8);
            for (let j = 0; j < 8; j += 2) {
                expect(baseTable[i+j].umod(p).eq(expected[j/2].x)).to.equal(true);
                expect(baseTable[i+j+1].umod(p).eq(p.sub(expected[j/2].y))).to.equal(true);
                expect(baseTable[i+32-j-2].umod(p).eq(expected[j/2].x)).to.equal(true);
                expect(baseTable[i+32-j-1].umod(p).eq(expected[j/2].y)).to.equal(true);
                expect(endoTable[i+j].umod(p).eq(beta.mul(expected[j/2].x).umod(p))).to.equal(true);
                expect(endoTable[i+j+1].umod(p).eq(p.sub(expected[j/2].y))).to.equal(true);
                expect(endoTable[i+32-j-2].umod(p).eq(beta.mul(expected[j/2].x).umod(p))).to.equal(true);
                expect(endoTable[i+32-j-1].umod(p).eq(expected[j/2].y)).to.equal(true);
            }
        }

        // console.log('memory = ', memory);
    });
});

// all of those betas... we need to add BETA onto the stack to prevent bytecode-bloating PUSH ops