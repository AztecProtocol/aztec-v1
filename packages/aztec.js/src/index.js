const path = require('path');

const abiEncoder = require(path.join(__dirname, 'abiEncoder'));
const bn128 = require(path.join(__dirname, 'bn128'));
const keccak = require(path.join(__dirname, 'keccak'));
const note = require(path.join(__dirname, 'note'));
const proof = require(path.join(__dirname, 'proof'));
const secp256k1 = require(path.join(__dirname, 'secp256k1'));
const setup = require(path.join(__dirname, 'setup'));
const sign = require(path.join(__dirname, 'sign'));

// Will get deprecated in ^2.0 in favour of the @aztec/dev-utils package
const params = require(path.join(__dirname, 'params'));

module.exports = {
    abiEncoder,
    bn128,
    keccak,
    note,
    params,
    proof,
    secp256k1,
    setup,
    sign,
};
