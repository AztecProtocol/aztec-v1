const BN = require('bn.js');
const EC = require('elliptic');

const bn128Reference = require('./bn128_reference');

const { p, n } = bn128Reference;

const utils = {};


// eslint-disable-next-line new-cap
utils.referenceCurve = new EC.curve.short({
    a: '0',
    b: '3',
    p: p.toString(16),
    n: n.toString(16),
    gRed: false,
    g: ['1', '2'],
});


utils.sliceMemory = (memArray) => {
    const numWords = Math.ceil(memArray.length / 32);
    const result = [];
    for (let i = 0; i < numWords * 32; i += 32) {
        result.push(new BN(memArray.slice(i, i + 32), 16));
    }
    return result;
};

utils.generatePoints = (numPoints) => {
    const points = [...new Array(numPoints)]
        .map(() => bn128Reference.randomPoint())
        .map(point => ({ x: point.x, y: point.y, z: new BN(1) }));
    return points;
};

utils.generateScalars = (numPoints) => {
    return [...new Array(numPoints)].map(() => bn128Reference.randomScalar());
};

utils.generateCalldata = (points, scalars) => {
    const numPoints = points.length;
    if (numPoints !== scalars.length) { throw new Error('num points !== num scalars!'); }
    const pointBuffer = Buffer.concat(points.map(({ x, y }) => Buffer.concat([x.toBuffer('be', 32), y.toBuffer('be', 32)])));
    const scalarBuffer = Buffer.concat(scalars.map(s => s.toBuffer('be', 32)));
    const calldata = Buffer.concat([pointBuffer, scalarBuffer]);
    const expected = points.reduce((acc, { x, y }, i) => {
        if (!acc) {
            return utils.referenceCurve.point(x, y).mul(scalars[i]);
        }
        return acc.add(utils.referenceCurve.point(x, y).mul(scalars[i]));
    }, null);
    return { calldata, expected };
};

utils.generatePointData = (numPoints) => {
    return utils.generateCalldata(
        utils.generatePoints(numPoints),
        utils.generateScalars(numPoints)
    );
};

module.exports = utils;
