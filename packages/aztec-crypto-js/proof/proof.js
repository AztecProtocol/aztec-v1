/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module proof
 */
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const Hash = require('../keccak/keccak');
const bn128 = require('../bn128/bn128');

const { groupReduction } = bn128;

const proof = {};

/**
 * Construct AZTEC join-split proof transcript
 *
 * @method constructJoinSplit
 * @param {Object[]} notes array of AZTEC notes
 * @param {Number} m number of input notes
 * @param {String} sender Ethereum address of transaction sender
 * @param {String} kPublic public commitment being added to proof
 * @returns {Object} proof data and challenge
 */
proof.constructJoinSplit = (notes, m, sender, kPublic = 0) => {
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Hash();

    // convert kPublic into a BN instance if it is not one
    let kPublicBn;
    if (BN.isBN(kPublic)) {
        kPublicBn = kPublic;
    } else if (kPublic < 0) {
        kPublicBn = bn128.n.sub(new BN(-kPublic));
    } else {
        kPublicBn = new BN(kPublic);
    }

    // construct initial hash of note commitments
    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    // finalHash is used to create final proof challenge
    const finalHash = new Hash();
    finalHash.appendBN(new BN(sender.slice(2), 16)); // add message sender to hash
    finalHash.appendBN(kPublicBn); // add kPublic to hash
    finalHash.appendBN(new BN(m)); // add input note variable to hash
    finalHash.data = [...finalHash.data, ...rollingHash.data]; // add note commitments into finalHash
    rollingHash.keccak(); // create first iteration of rollingHash

    // define 'running' blinding factor for the k-parameter in final note
    let runningBk = new BN(0).toRed(groupReduction);
    const blindingFactors = notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;
        let x = new BN(0).toRed(groupReduction);
        if (i === (notes.length - 1)) {
            if (i + 1 === m) {
                bk = new BN(0).toRed(groupReduction).redSub(runningBk);
            } else {
                bk = runningBk;
            }
        }
        if ((i + 1) > m) {
            x = rollingHash.toGroupScalar(groupReduction);
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);
            runningBk = runningBk.redSub(bk);
            rollingHash.keccak();
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
        } else {
            runningBk = runningBk.redAdd(bk);
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        }

        finalHash.append(B);
        return {
            bk,
            ba,
            B,
            x,
        };
    });
    finalHash.keccak();
    const challenge = finalHash.toGroupScalar(groupReduction);
    const proofData = blindingFactors.map((blindingFactor, i) => {
        let kBar = ((notes[i].k.redMul(challenge)).redAdd(blindingFactor.bk)).fromRed();
        const aBar = ((notes[i].a.redMul(challenge)).redAdd(blindingFactor.ba)).fromRed();
        if (i === (notes.length - 1)) {
            kBar = kPublicBn;
        }
        return [
            `0x${padLeft(kBar.toString(16), 64)}`,
            `0x${padLeft(aBar.toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.y.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.y.fromRed().toString(16), 64)}`,
        ];
    });
    return {
        proofData,
        challenge: `0x${padLeft(challenge)}`,
    };
};

module.exports = proof;
