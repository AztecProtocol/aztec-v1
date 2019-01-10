/* eslint-disable import/no-dynamic-require */

const path = require('path');

const bn128 = require(path.join(__dirname, 'bn128'));
const eip712 = require(path.join(__dirname, 'eip712'));
const keccak = require(path.join(__dirname, 'keccak'));
const note = require(path.join(__dirname, 'note'));
const proof = require(path.join(__dirname, 'proof'));
const secp256k1 = require(path.join(__dirname, 'secp256k1'));
const setup = require(path.join(__dirname, 'setup'));

module.exports = {
    bn128,
    eip712,
    keccak,
    note,
    proof,
    secp256k1,
    setup,
};
