import * as bn128 from '@aztec/bn128';
import BN from 'bn.js';
import { keccak256, padLeft, randomHex } from 'web3-utils';
import ProofType from '../../src/proof/base/types';

// kBar, aBar, gamma.x, gamma., sigma.x, sigma.y
const zeroNote = Array(6).fill('0'.repeat(64));
// blindingFactor.x, blindingFactor.y
const zeroBlindingFactors = Array(2).fill('0'.repeat(64));

export function mockZeroProof() {
    const m = 1;
    const publicOwner = padLeft(randomHex(20), 64).slice(2);
    const sender = padLeft(randomHex(20), 64).slice(2);

    const zeroProof = {};
    zeroProof.inputNotes = [zeroNote.map((element) => `0x${element}`)];
    zeroProof.m = m;
    zeroProof.notes = zeroProof.inputNotes;
    zeroProof.publicOwner = publicOwner;
    zeroProof.sender = sender;

    return zeroProof;
};

export function mockZeroJoinSplitProof() {
    const zeroProof = mockZeroProof();
    const publicValue = padLeft(Math.floor(Math.random() * 100).toString(), 64);
    const challengeArray = [
        zeroProof.sender,
        publicValue,
        padLeft(`${zeroProof.m}`, 64),
        zeroProof.publicOwner,
        ...zeroNote.slice(2),
        ...zeroBlindingFactors,
    ];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = [[`0x${publicValue}`, zeroNote[1], zeroNote[2], zeroNote[3], zeroNote[4], zeroNote[5]]];
    zeroProof.publicValue = publicValue;
    zeroProof.type = ProofType.JOIN_SPLIT.name;

    return zeroProof;
};

export function mockZeroSwapProof() {
    const zeroProof = mockZeroProof();
    const challengeArray = [zeroProof.sender, ...zeroNote.slice(2), ...zeroBlindingFactors];
    const challengeHash = keccak256(`0x${challengeArray.join('')}`);

    zeroProof.challenge = new BN(challengeHash.slice(2), 16).umod(bn128.curve.n);
    zeroProof.challengeHex = `0x${zeroProof.challenge.toString(16)}`;
    zeroProof.data = Array(4).fill(zeroNote.map((element) => `0x${element}`));
    zeroProof.type = ProofType.SWAP.name;

    return zeroProof;
};
