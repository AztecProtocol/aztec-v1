const BN = require('bn.js');
const crypto = require('crypto');

const p = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);
const pRed = BN.red(p);

// bn128 weierstrass formula = y^2 = x^3 + 3
const b = new BN('3', 10).toRed(pRed);

const beta = new BN('1e37a68a14ddd1f28e9f6452322e6f2c22a573dc45aa1e7dcf6917dda1583b6e', 16);
const lambda = new BN('b3c4d79d41a917585bfc41088d8daaa78b17ea66b99c90dd', 16);
const basis = [
    {
        a: new BN('89d3256894d213e3', 16),
        b: new BN('-6f4d8248eeb859fc8211bbeb7d4f1128', 16), // 30644e72e131a029b85045b68181585e06ceecda572a2489be32480255cc0e6f need this?
    },
    {
        a: new BN('6f4d8248eeb859fd0be4e1541221250b', 16),
        b: new BN('89d3256894d213e3', 16),
    }
]


const one = new BN('1', 10);

const bn128 = {};

bn128.p = p;
bn128.pRed = pRed;

function _double({ x, y, z }) {
    let xx = x.redSqr();
    let yy = y.redSqr();
    let yyyy = yy.redSqr();
    let zz = z.redSqr();
    let s = x.redAdd(yy).redSqr().redSub(xx).redSub(yyyy);
    s = s.redAdd(s);
    let m = xx.redAdd(xx).redAdd(xx);
    let t = m.redSqr().redSub(s).redSub(s);
    let x3 = t;
    let yyyy8 = yyyy.redAdd(yyyy);
    yyyy8 = yyyy8.redAdd(yyyy8);
    yyyy8 = yyyy8.redAdd(yyyy8);
    let y3 = s.redSub(t).redMul(m).redSub(yyyy8);
    let z3 = y.add(z).redSqr().redSub(yy).redSub(zz);
    return {
        x: x3,
        y: y3,
        z: z3,
    };
}

function _mixedAdd({ x2, y2 }, { x1, y1, z1 }) {
    let t1 = z1.redSqr();
    let t2 = t1.redMul(z1);
    t1 = t1.redMul(x2);
    t2 = t2.redMul(y2);
    t1 = x1.redSub(t1);
    t2 = t2.redSub(y1);
    let z3 = z1.redMul(t1);
    let t4 = t1.redSqr();
    t1 = t1.redMul(t4);
    t4 = t4.redMul(x1);
    let x3 = t2.redSqr();
    x3 = x3.redAdd(t1);
    let y3 = t1.redMul(y1);
    t1 = t4.redAdd(t4);
    x3 = x3.redSub(t1);
    t4 = x3.redSub(t4);
    t4 = t4.redMul(t2);
    y3 = t4.redSub(y3);
    return {
        x: x3,
        y: y3,
        z: z3,
    };
}

function _normalize({ x, y, z }, newZ) {
    const zz = newZ.redSqr();
    return {
        x: x.redMul(zz),
        y: y.redMul(newZ.redMul(zz)),
        z,
    };
}

bn128.zFactors = ({ x2, y2 }, { x1, y1, z1 }) => {
    const z1Red = z1.toRed(pRed);
    const x2Red = x2.toRed(pRed);
    const x1Red = x1.toRed(pRed);
    let t1 = z1Red.redSqr();
    let t2 = t1.redMul(z1Red);
    t1 = t1.redMul(x2Red);
    t1 = x1Red.redSub(t1);
    const zz = t1.redSqr();
    const zzz = zz.redMul(t1);
    return {
        zz: zz.fromRed(),
        zzz: zzz.fromRed(),
    };
};

bn128.double = (x, y, z) => {
    let xRed = x.toRed(pRed);
    let yRed = y.toRed(pRed);
    let zRed = z.toRed(pRed);
    let p = _double({ x: xRed, y: yRed, z: zRed });
    return {
        x: p.x.fromRed(),
        y: p.y.fromRed(),
        z: p.z.fromRed(),
    }
};

bn128.mixedAdd = (x2, y2, x1, y1, z1) => {
    let debug;
    let x2Red = x2.toRed(pRed);
    let y2Red = y2.toRed(pRed);
    let x1Red = x1.toRed(pRed);
    let y1Red = y1.toRed(pRed);
    let z1Red = z1.toRed(pRed);

    let p = _mixedAdd({ x2: x2Red, y2: y2Red }, { x1: x1Red, y1: y1Red, z1: z1Red });
    return {
        x: p.x.fromRed(),
        y: p.y.fromRed(),
        z: p.z.fromRed(),
    };
};

bn128.generateTableMultiple = (points) => {
    const windowSize = 8;
    let normalizeFactor = new BN('1', 10).toRed(pRed);
    const tableTemp = points.map(({ x, y }) => {
        // normalize point
        const xRed = x.toRed(pRed);
        const yRed = y.toRed(pRed);
        const nn = normalizeFactor.redSqr();
        const xMod = xRed.redMul(nn);
        const yMod = yRed.redMul(nn.redMul(normalizeFactor));
        const res = bn128.generateTableSingle(xMod.fromRed(), yMod.fromRed(), normalizeFactor.fromRed());
        normalizeFactor = normalizeFactor.redMul(res.p[res.p.length - 1].z.toRed(pRed));
        return res;
    });
    console.log('table temp = ', tableTemp);
    const tmp = tableTemp[tableTemp.length - 1];
    const globalZ = tableTemp[tableTemp.length - 1].p[windowSize - 1].z;
    console.log('global z = ', globalZ.toString(16));
    let runningZ = new BN('1', 10).toRed(pRed);
    let tableCoordinates = [];
    const runningZDebug = [runningZ.fromRed()];
    for (let i = tableTemp.length - 1; i > -1; i -= 1) {
        const table = tableTemp[i];
        for (let j = table.p.length - 1; j > -1; j -= 1) {
            const zz = runningZ.redSqr();
            const zzz = zz.redMul(runningZ);
            const x = table.p[j].x.toRed(pRed).redMul(zz);
            const y = table.p[j].y.toRed(pRed).redMul(zzz);
            tableCoordinates.push({ x: x.fromRed(), y: y.fromRed() });

            if (j > 0) {
                // we fill dz in a weird way, first entry does not exist so point j
                // corresponds to j-1
                runningZ = runningZ.redMul(table.dz[j-1].toRed(pRed));
                runningZDebug.push(runningZ.fromRed());
            }

       
        }
    }
    console.log('running z result = ', runningZ.fromRed().toString(16));
    return tableCoordinates;
};

// so how does the normalization work
// we have an affine P
// we get a jacobian 2P
// we then scale P's x-y coords to that of 2P.
// so it's z-coord is off by a factor of 2Y
// we then cache all of the U-factors for subsequent addition chains
// the overall z coordinate can be reconstructed from multiplying U's
// but then multiplying by 2Y. 

// when we hit our second point we have an affine P
// we convert to a Jacobean P' by scaling by the previous point's z coordinate
// we then calculate 2P, which has a different z-coordinate
// we then normalize P to 2Ps z-coordinate and treat 2P, P as affine
// then calculate U factors that transform future additions
// hmm

bn128.generateTableSingle = (x, y, z) => {
    const pBase = { x: x.toRed(pRed), y: y.toRed(pRed), z: z.toRed(pRed) };
    const dBase = _double(pBase);
    const d = { x: dBase.x, y: dBase.y };
    const p = [];
    const dz = [];
    let zAcc = pBase.z;
    let prev = _normalize(pBase, dBase.z);
    p.push({ x: prev.x.fromRed(), y: prev.y.fromRed(), z: prev.z.fromRed() });

    for(let i = 1; i < 8; i += 1) {
        let zz = prev.z.redSqr();
        let u = prev.x.redSub(d.x.redMul(zz));
        dz.push(u.fromRed());
        prev = _mixedAdd({ x2: d.x, y2: d.y}, { x1: prev.x, y1: prev.y, z1: prev.z });
        p.push({ x: prev.x.fromRed(), y: prev.y.fromRed(), z: prev.z.fromRed() });
    }
    let t = p[p.length - 1].z.toRed(pRed);
    p[p.length - 1].z = t.redMul(dBase.z).fromRed();
    return { p, dz };
};

function randomPointInternal() {
    let x = new BN(crypto.randomBytes(32), 16);
    x = x.toRed(pRed);
    let y2 = x.redSqr().redMul(x).redAdd(b);
    let y = y2.redSqrt(); // well, either value of y is valid so no reason to be picky
    return { x, y };
}

bn128.randomPoint = () => {
    const { x, y } = randomPointInternal();
    return { x: x.fromRed(), y: y.fromRed() };
};

bn128.randomPointJacobian = () => {
    let { x, y } = randomPointInternal();
    let z = new BN(crypto.randomBytes(32), 16);
    z = z.toRed(pRed);
    let zz = z.redSqr();
    x = x.redMul(zz);
    y = y.redMul(zz).redMul(z);
    return {
        x: x.fromRed(),
        y: y.fromRed(),
        z: z.fromRed(),
    };
}
module.exports = bn128;