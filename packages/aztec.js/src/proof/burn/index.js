/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module proof.burn
 */

const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const verifier = require('./verifier');
const proofUtils = require('../proofUtils');
const joinSplit = require('../joinSplit');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const {
    inputCoder,
    outputCoder,
} = require('../../abiEncoder');

const { groupReduction } = bn128;


const burn = {};
burn.verifier = verifier;

/**
 * Generate random blinding scalars, conditional on the AZTEC join-split proof statement
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method generateBlindingScalars
 * @memberof proof.joinSplit
 * @param {number} n number of notes
 * @param {number} m number of input notes
 */
burn.generateBlindingScalars = (n) => {
    const m = 1;
    let runningBk = new BN(0).toRed(groupReduction);
    const scalars = [...Array(n)].map((v, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        if (i === (n - 1)) {
            if (n === m) {
                bk = new BN(0).toRed(groupReduction).redSub(runningBk);
            } else {
                bk = runningBk;
            }
        }

        if ((i + 1) > m) {
            runningBk = runningBk.redSub(bk);
        } else {
            runningBk = runningBk.redAdd(bk);
        }
        return { bk, ba };
    });
    return scalars;
};

burn.encodeBurnTransaction = ({
    newTotalBurned,
    oldTotalBurned,
    adjustedNotes,
    senderAddress,
}) => {
    const {
        proofData: proofDataRaw,
        challenge,
    } = burn.constructProof([...newTotalBurned, ...oldTotalBurned, ...adjustedNotes], senderAddress);

    const inputNotes = newTotalBurned;
    const outputNotes = [...oldTotalBurned, ...adjustedNotes];

    const inputOwners = inputNotes.map(m => m.owner);
    const outputOwners = outputNotes.map(n => n.owner);
    const publicOwner = '0x0000000000000000000000000000000000000000';
    const publicValue = 0;

    // const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12), proofDataRaw.slice(12, 18)]);

    const proofData = inputCoder.burn(
        proofDataRaw,
        challenge,
        inputOwners,
        outputOwners,
        outputNotes
    );

    const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
        inputNotes: [{
            ...outputNotes[0],
            forceMetadata: true,
        }],
        outputNotes: [{
            ...inputNotes[0],
            forceNoMetadata: true,
        }],
        publicOwner,
        publicValue,
    },
    {
        inputNotes: [],
        outputNotes: outputNotes.slice(1),
        publicOwner,
        publicValue,
    },
    ]).slice(0x42)}`;
    return { proofData, expectedOutput, challenge };
};


/**
 * Construct AZTEC burn proof transcript
 *
 * @method constructProof
 * @memberof proof.burn
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @returns {Object} proof data and challenge
 */
burn.constructProof = (notes, sender) => {
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Keccak();
    const m = 1;

    proofUtils.parseInputs(notes, sender);

    // construct initial hash of note commitments
    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    let x = new BN(0).toRed(groupReduction);

    let runningBk = new BN(0).toRed(groupReduction);

    const blindingScalars = joinSplit.generateBlindingScalars(notes.length, m);

    const blindingFactors = notes.map((note, i) => {
        let B;
        const { bk, ba } = blindingScalars[i];

        if ((i + 1) > m) { // if it's an output note
            // get next iteration of our rolling hash
            x = rollingHash.keccak(groupReduction);
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);
            runningBk = runningBk.redSub(bk);
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
        } else {
            runningBk = runningBk.redSub(bk);
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        }

        return {
            bk,
            ba,
            B,
            x,
        };
    });

    const challenge = proofUtils.computeChallenge(sender, notes, blindingFactors);

    const proofData = blindingFactors.map((blindingFactor, i) => {
        const kBar = ((notes[i].k.redMul(challenge)).redAdd(blindingFactor.bk)).fromRed();
        const aBar = ((notes[i].a.redMul(challenge)).redAdd(blindingFactor.ba)).fromRed();

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
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

module.exports = burn;
