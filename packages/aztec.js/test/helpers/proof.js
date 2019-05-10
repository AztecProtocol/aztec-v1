const BN = require('bn.js');
const { keccak256, padLeft, randomHex } = require('web3-utils');

const bn128 = require('../../src/bn128');
const { ProofType } = require('../../src/proof-v2/proof');

const mockZeroProof = () => {
    const publicOwner = padLeft('0x957c322bb708a0f0fe6b994d51d27fc3f68beffc', 64).slice(2);
    const publicValue = 132;
    const sender = padLeft('0x957c322bb708a0f0fe6b994d51d27fc3f68beffc', 64).slice(2);
    const note = Array(6).fill(`${padLeft('0', 64)}`);
    const challengeArray = [sender, padLeft(publicValue.toString(), 64), padLeft('1', 64), publicOwner, ...note];
    const challengeString = `0x${challengeArray.join('')}`;

    const zeroProof = {};
    zeroProof.challenge = new BN(keccak256(challengeString).slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = [[`0x${padLeft(publicValue.toString(), 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];
    zeroProof.m = 1;
    zeroProof.publicOwner = publicOwner;
    zeroProof.publicValue = publicValue;
    zeroProof.sender = sender;
    return zeroProof;
};

const mockZeroJoinSplitProof = () => {
    const zeroProof = mockZeroProof();
    zeroProof.type = ProofType.JOIN_SPLIT.name;
    return zeroProof;
};

module.exports = { mockZeroJoinSplitProof, mockZeroProof };
