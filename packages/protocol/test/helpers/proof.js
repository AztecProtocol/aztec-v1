/**
 * Duplicated from aztec.js/test and delayed the creation of a test-utils package.
 */
const { ProofType } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { keccak256, padLeft } = require('web3-utils');

// kBar, aBar, gamma.x, gamma., sigma.x, sigma.y
const zeroNote = Array(6).fill('0'.repeat(64));

// blindingFactor.x, blindingFactor.y
const zeroBlindingFactors = Array(2).fill('0'.repeat(64));

// Fake g2 point generated in a fake trusted setup. Complex numbers rearranged into
// position expected by libff
const fakeT2 = [
    '0x297F1A1DEEF4C8A3709028B95B9C1FDEB4CE09A3113921933D950525D7864716',
    '0x1241A123193A962F38BD839A4F002F967658A2080E41763FFD20B9A005794F0C',
    '0xB0254AD2EA7179F031B0C854DD185559417FCFC3AFA5DFBD06565BDACA24C0A',
    '0x78E97961554D14F31802CF063370F96C3ED42ED2F7EF2F64A6F3C15472580A5',
];

const FAKE_CRS = [`0x${bn128.H_X.toString(16)}`, `0x${bn128.H_Y.toString(16)}`, ...fakeT2];

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

const mockZeroPrivateRangeProof = () => {
    const zeroProof = mockZeroProof();
    const publicValue = constants.ZERO_BN;
    const publicOwner = constants.addresses.ZERO_ADDRESS;
    const challengeArray = [zeroProof.sender, publicValue, publicOwner, ...zeroNote.slice(2), ...zeroBlindingFactors];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = Array(3).fill(zeroNote.map((element) => `0x${element}`));
    zeroProof.type = ProofType.PRIVATE_RANGE.name;
    return zeroProof;
};

const mockZeroPublicRangeProof = () => {
    const zeroProof = mockZeroProof();
    const publicValue = padLeft('00', 64);
    const publicComparison = padLeft('00', 64);
    const challengeArray = [
        zeroProof.sender,
        publicComparison,
        publicValue,
        zeroProof.publicOwner,
        ...zeroNote.slice(2),
        ...zeroBlindingFactors,
    ];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = Array(4).fill(zeroNote.map((element) => `0x${element}`));
    zeroProof.publicValue = publicValue;
    zeroProof.type = ProofType.PUBLIC_RANGE.name;
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
    FAKE_CRS,
    mockZeroDividendProof,
    mockZeroJoinSplitProof,
    mockZeroJoinSplitFluidProof,
    mockZeroPrivateRangeProof,
    mockZeroProof,
    mockZeroPublicRangeProof,
    mockZeroSwapProof,
};
