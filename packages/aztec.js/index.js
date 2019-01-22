/* eslint-disable import/no-dynamic-require */

const path = require('path');

const bn128 = require(path.join(__dirname, 'src', 'bn128'));
const eip712 = require(path.join(__dirname, 'src', 'eip712'));
const keccak = require(path.join(__dirname, 'src', 'keccak'));
const note = require(path.join(__dirname, 'src', 'note'));
const params = require(path.join(__dirname, 'src', 'params'));
const proof = require(path.join(__dirname, 'src', 'proof'));
const secp256k1 = require(path.join(__dirname, 'src', 'secp256k1'));
const setup = require(path.join(__dirname, 'src', 'setup'));

module.exports = {
    bn128,
    eip712,
    keccak,
    note,
    params,
    proof,
    secp256k1,
    setup,
};
