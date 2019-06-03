/**
 * Duplicated from aztec.js/test and delayed the creation of a test-utils package.
 */
const { bn128, ProofType } = require('aztec.js');
const BN = require('bn.js');
const { keccak256, padLeft } = require('web3-utils');

// kBar, aBar, gamma.x, gamma., sigma.x, sigma.y
const zeroNote = Array(6).fill('0'.repeat(64));

// blindingFactor.x, blindingFactor.y
const zeroBlindingFactors = Array(2).fill('0'.repeat(64));

const mockZeroProof = () => {
    const zeroProof = {};
    zeroProof.m = 0;
    zeroProof.sender = padLeft('00', 64);
    return zeroProof;
};

const mockZeroDividendProof = () => {
    const zeroProof = mockZeroProof();
    const za = padLeft('00', 64);
    const zb = padLeft('00', 64);
    const challengeArray = [zeroProof.sender, za, zb, ...zeroNote.slice(2), ...zeroBlindingFactors];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = Array(4).fill(zeroNote.map((element) => `0x${element}`));
    zeroProof.type = ProofType.DIVIDEND.name;
    zeroProof.za = za;
    zeroProof.zb = zb;
    return zeroProof;
};

const mockZeroJoinSplitProof = () => {
    const zeroProof = mockZeroProof();
    const publicValue = padLeft('00', 64);
    const publicOwner = padLeft('00', 64);
    const challengeArray = [
        zeroProof.sender,
        publicValue,
        padLeft(`${zeroProof.m}`, 64),
        zeroProof.publicOwner,
        ...zeroNote,
        ...zeroBlindingFactors,
    ];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = [[`0x${publicValue}`, zeroNote[1], zeroNote[2], zeroNote[3], zeroNote[4], zeroNote[5]]];
    zeroProof.publicValue = publicValue;
    zeroProof.publicOwner = publicOwner;
    zeroProof.type = ProofType.JOIN_SPLIT.name;
    return zeroProof;
};

const mockZeroJoinSplitFluidProof = () => {
    const zeroProof = mockZeroProof();
    const publicValue = padLeft('00', 64);
    const challengeArray = [zeroProof.sender, publicValue, padLeft(`${zeroProof.m}`, 64), ...zeroNote, ...zeroBlindingFactors];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = [[`0x${publicValue}`, zeroNote[1], zeroNote[2], zeroNote[3], zeroNote[4], zeroNote[5]]];
    zeroProof.publicValue = publicValue;
    zeroProof.type = ProofType.JOIN_SPLIT.name;
    return zeroProof;
};

const mockZeroSwapProof = () => {
    const zeroProof = mockZeroProof();
    const challengeArray = [zeroProof.sender, ...zeroNote.slice(2), ...zeroBlindingFactors];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = Array(4).fill(zeroNote.map((element) => `0x${element}`));
    zeroProof.type = ProofType.SWAP.name;
    return zeroProof;
};

module.exports = {
    mockZeroProof,
    mockZeroDividendProof,
    mockZeroJoinSplitProof,
    mockZeroJoinSplitFluidProof,
    mockZeroSwapProof,
};
