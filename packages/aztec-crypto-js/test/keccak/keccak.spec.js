const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');
const BN = require('bn.js');

const { expect } = chai;

const Keccak = require('../../keccak/keccak');
const bn128 = require('../../bn128/bn128');

describe('keccak tests', () => {
    it('keccak will correctly hash a set of points', () => {
        const points = [
            [
                '763de812dec810215bc17987e5d2a0ba8dfb00d9b7df29ab857ee446d98e4cf',
                '2201082870c343ebcabce44eea82167c55d321a3f816c7e4e56b729f9dd6a6a9',
            ],
            [
                '15f28289950c3d809a96598945f198061c072ec936a5666a5ee01af6632ae860',
                '44a4a7aa3d630f8128673a386a8580910cb002d7c1e785185a2c27e5cd91ec4',
            ],
        ];

        const keccak = new Keccak();
        keccak.append(bn128.point(new BN(points[0][0], 16), new BN(points[0][1], 16)));
        keccak.append(bn128.point(new BN(points[1][0], 16), new BN(points[1][1], 16)));
        const hash = keccak.keccak();

        const expected = sha3(points.reduce((r, [a, b]) => `${r}${padLeft(a, 64)}${padLeft(b, 64)}`, '0x'), 'hex').slice(2);

        expect(hash[0]).to.equal(expected);
        expect(keccak.keccak(bn128.groupReduction).fromRed().toString(16))
            .to.equal(new BN(sha3(`0x${expected}`).slice(2), 16).umod(bn128.n).toString(16));
    });

    it('keccak will correctly hash a set of BN big numbers', () => {
        const numbers = [
            '87e5d2a0ba8dfb00d9b7df29ab857ee446d98e4cf',
            '2201082870c343ebcabce44eea82167c55d321a3f816c7e4e56b729f9dd6a6a9',
            '44a4a7aa3d630f8128673a386a8580910cb002d7c1e785185a2c27e5cd91ec4',
        ];

        const keccak = new Keccak();
        numbers.forEach((n) => { keccak.appendBN(new BN(n, 16)); });
        keccak.keccak();

        const expected = sha3(numbers.reduce((r, n) => `${r}${padLeft(n, 64)}`, '0x'), 'hex').slice(2);
        expect(keccak.data[0]).to.equal(expected);
    });
});
