const ethers = require('ethers');
const BN = require('bn.js');
const EC = require('elliptic');
const path = require('path');
const fs = require('fs');

const bn128Reference = require('./bn128_reference');

ethers.errors.setLogLevel('error');

const { p, n } = bn128Reference;

const utils = {};

const pathToProjectData = path.posix.resolve(__dirname, '../huff_projects');
const projectParams = JSON.parse(fs.readFileSync(path.join(pathToProjectData, 'weierstrudel_project.json')));
const contractInterface = new ethers.utils.Interface(projectParams.abi);

// eslint-disable-next-line new-cap
const referenceCurve = new EC.curve.short({
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
    const calldata = Buffer.from(contractInterface
        .functions[`eccMul(uint256[2][${numPoints}],uint256[${numPoints}])`]
        .encode([
            points.map(({ x, y }) => [x.toString(10), y.toString(10)]),
            scalars.map(s => s.toString(10)),
        ])
        .slice(2), 'hex');
    const expected = points.reduce((acc, { x, y }, i) => {
        if (!acc) {
            return referenceCurve.point(x, y).mul(scalars[i]);
        }
        return acc.add(referenceCurve.point(x, y).mul(scalars[i]));
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
