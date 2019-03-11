const path = require('path');

const abiEncoder = require(path.join(__dirname, 'abiEncoder'));
const bn128 = require(path.join(__dirname, 'bn128'));
const keccak = require(path.join(__dirname, 'keccak'));
const note = require(path.join(__dirname, 'note'));
const proof = require(path.join(__dirname, 'proof'));
const secp256k1 = require(path.join(__dirname, 'secp256k1'));
const setup = require(path.join(__dirname, 'setup'));
const sign = require(path.join(__dirname, 'sign'));

module.exports = {
    abiEncoder,
    bn128,
    keccak,
    note,
    proof,
    secp256k1,
    setup,
    sign,
};
