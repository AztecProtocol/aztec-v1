/* eslint-disable no-underscore-dangle */
const BN = require('bn.js');
const EC = require('elliptic');

const chai = require('chai');

const bn128 = require('./bn128_reference');

const { expect } = chai;

const { p, pRed, n } = bn128;

// eslint-disable-next-line new-cap
const referenceCurve = new EC.curve.short({
    a: '0',
    b: '3',
    p: p.toString(16),
    n: n.toString(16),
    gRed: false,
    g: ['1', '2'],
});

function getComparisonTable(x, y, z) {
    const normalized = bn128.toAffine({ x, y, z });
    const point = referenceCurve.point(normalized.x.fromRed(), normalized.y.fromRed());
    const table = [point];
    for (let i = 1; i < 8; i += 1) {
        table[i] = point.mul(new BN(i * 2 + 1));
    }

    return table;
}

describe('arithmetic tests', () => {
    it('double works', () => {
        const pBase = bn128.randomPointInternal();
        const ecPoint = referenceCurve.point(pBase.x.fromRed(), pBase.y.fromRed());

        const result = bn128._double({ x: pBase.x, y: pBase.y, z: new BN(1).toRed(pRed) });
        const zz = result.z.redSqr();
        const zzz = zz.redMul(result.z);
        const dx = result.x.redMul(zz.redInvm());
        const dy = result.y.redMul(zzz.redInvm());

        const expected = ecPoint.mul(new BN(2));
        expect(expected.x.fromRed().eq(dx.fromRed())).to.equal(true);
        expect(expected.y.fromRed().eq(dy.fromRed())).to.equal(true);
    });

    it('add works', () => {
        const pBase = bn128.randomPointInternal();
        const ecPoint = referenceCurve.point(pBase.x.fromRed(), pBase.y.fromRed());

        const double = bn128._double({ x: pBase.x, y: pBase.y, z: new BN(1).toRed(pRed) });
        const addRes = bn128._add(pBase.x, pBase.y, new BN(1).toRed(pRed), double.x, double.y, double.z);
        const result = bn128.toAffine(addRes);
        const expected = ecPoint.mul(new BN(3));

        expect(expected.x.fromRed().eq(result.x.fromRed())).to.equal(true);
        expect(expected.y.fromRed().eq(result.y.fromRed())).to.equal(true);
    });
    // TODO: automatically convert to reduction context
    it('mixed add works', () => {
        const jacobianPoint = bn128.randomPointJacobian();
        const p1 = bn128.toAffine({
            x: jacobianPoint.x.toRed(pRed),
            y: jacobianPoint.y.toRed(pRed),
            z: jacobianPoint.z.toRed(pRed),
        });
        const p2 = bn128.randomPointInternal();
        const ecPoints = [
            referenceCurve.point(p1.x.fromRed(), p1.y.fromRed()),
            referenceCurve.point(p2.x.fromRed(), p2.y.fromRed()),
        ];
        const result = bn128.toAffine(
            bn128._mixedAdd(
                { x2: p2.x, y2: p2.y },
                {
                    x1: jacobianPoint.x.toRed(pRed),
                    y1: jacobianPoint.y.toRed(pRed),
                    z1: jacobianPoint.z.toRed(pRed),
                },
            ),
        );
        const expected = ecPoints[0].add(ecPoints[1]);
        expect(expected.x.fromRed().eq(result.x.fromRed())).to.equal(true);
        expect(expected.y.fromRed().eq(result.y.fromRed())).to.equal(true);
    });
});

describe('bn128 table test', () => {
    it('precomputed single table performs correct point additions', () => {
        const { x, y, z } = bn128.randomPointJacobian();
        const { table, doubleZ } = bn128.generateSingleTable(x, y, z);
        const comparisonTable = getComparisonTable(x.toRed(pRed), y.toRed(pRed), z.toRed(pRed));
        for (let i = 0; i < table.length; i += 1) {
            const point = table[i];
            point.z = point.z.redMul(doubleZ);
            const result = bn128.toAffine(point);
            const expected = comparisonTable[i];
            expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
            expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
        }
    });

    it('rescaling a precomputed single table creates correct point table', () => {
        const { x, y, z } = bn128.randomPointJacobian();
        const { table, zFactors, tableZ: globalZ } = bn128.generateSingleTable(x, y, z);
        const normalizedTable = [];
        let runningZ = new BN(1).toRed(pRed);
        let j = table.length - 1;
        while (j >= 0) {
            const zz = runningZ.redSqr();
            const zzz = zz.redMul(runningZ);
            normalizedTable[j] = { x: table[j].x.redMul(zz), y: table[j].y.redMul(zzz), z: globalZ };
            if (j !== 0) {
                runningZ = runningZ.redMul(zFactors[j - 1]);
            }
            j -= 1;
        }
        const comparisonTable = getComparisonTable(x.toRed(pRed), y.toRed(pRed), z.toRed(pRed));
        for (let i = 0; i < normalizedTable.length; i += 1) {
            const point = normalizedTable[i];
            const result = bn128.toAffine(point);
            const expected = comparisonTable[i];
            expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
            expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
        }
    });

    it('generateMultiTable performs correct point additions', () => {
        const points = [bn128.randomPointInternal(), bn128.randomPointInternal(), bn128.randomPointInternal()];
        const { tables } = bn128.generateTable(points);
        const comparisonTables = points.map((point) => getComparisonTable(point.x, point.y, new BN(1).toRed(pRed)));

        for (let i = 0; i < tables.length; i += 1) {
            const { table, doubleZ } = tables[i];
            const comparison = comparisonTables[i];
            for (let j = 0; j < table.length; j += 1) {
                const point = table[j];
                point.z = point.z.redMul(doubleZ);
                const result = bn128.toAffine(point);
                const expected = comparison[j];
                expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
                expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
            }
        }
    });

    it('PRECOMPUTE_TABLE__RESCALEMultiTable correctly PRECOMPUTE_TABLE__RESCALEs a multi-table', () => {
        const points = [
            bn128.randomPointInternal(),
            bn128.randomPointInternal(),
            bn128.randomPointInternal(),
            bn128.randomPointInternal(),
        ];
        const { tables, globalZ } = bn128.generateTable(points);
        const comparisonTables = points.map((point) => getComparisonTable(point.x, point.y, new BN(1).toRed(pRed)));
        const scaledTables = bn128.PRECOMPUTE_TABLE__RESCALEMultiTable(tables, globalZ);
        for (let i = scaledTables.length - 1; i >= 0; i -= 1) {
            const table = scaledTables[i];
            const comparison = comparisonTables[i];
            for (let j = table.length - 1; j >= 0; j -= 1) {
                const result = bn128.toAffine(table[j]);
                const expected = comparison[j];
                expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
                expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
            }
        }
    });
});
