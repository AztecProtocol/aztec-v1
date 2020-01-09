import * as bn128 from '@aztec/bn128';
import { constants } from '@aztec/dev-utils';
import BN from 'bn.js';
import { expect } from 'chai';

export function validateElement(xHex, yHex) {
    const x = new BN(xHex.slice(2), 16);
    const y = new BN(yHex.slice(2), 16);
    expect(x.gt(constants.ZERO_BN)).to.equal(true);
    expect(y.gt(constants.ZERO_BN)).to.equal(true);
    expect(x.lt(bn128.curve.p)).to.equal(true);
    expect(y.lt(bn128.curve.p)).to.equal(true);
    const lhs = x
        .mul(x)
        .mul(x)
        .add(new BN(3))
        .umod(bn128.curve.p);
    const rhs = y.mul(y).umod(bn128.curve.p);
    expect(lhs.eq(rhs)).to.equal(true);
};

export function validateScalar(hex, canBeZero = false) {
    const scalar = new BN(hex.slice(2), 16);
    expect(scalar.lt(bn128.curve.n)).to.equal(true);
    if (!canBeZero) {
        expect(scalar.gt(constants.ZERO_BN)).to.equal(true);
    }
};