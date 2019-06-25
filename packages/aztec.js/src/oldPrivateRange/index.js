/**
 * Constructs AZTEC private range zero-knowledge proofs
 *
 * @module privateRange
 * @dev This module constructs the proof data required
 * to prove in zero knowledge that the value of one note is 'greater
 * than or equal to', or 'less than or equal to' another note.
 *
 * The 'encodePrivateRangeTransaction()` function takes two
 * inputs: originalNote and comparisonNote. The originalNote is the one
 * that a user is seeking to prove has a value greater than or equal to, or
 * less than or equal to the comparison note.
 *
 * To prove a greater than relation, the originalNote is input first and the
 * comparisonNote second. To prove a less than relationship, the notes are swapped
 * around.
 */
const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const crypto = require('crypto');

const bn128 = require('../bn128');
const proofUtils = require('./proofUtils');
const verifier = require('./verifier');
const Keccak = require('../keccak');
// const helpers = require('./helpers');

const oldPrivateRange = {};
oldPrivateRange.verifier = verifier;
// oldPrivateRange.helpers = helpers;


/**
 * Construct blinding factors
 *
 * @method constructBlindingFactors
 * @param {Object[]} notes AZTEC notes
 * @param {Keccak} rollingHash structure containing the note data, to be hashe
 * @returns {Object[]} blinding factors
 */
oldPrivateRange.constructBlindingFactors = (notes, rollingHash) => {
    const bkArray = [];
    let bk;
    let B;
    let x = new BN(0).toRed(constants.BN128_GROUP_REDUCTION);
    const baSelection = [new BN(74598).toRed(constants.BN128_GROUP_REDUCTION), new BN(85944).toRed(constants.BN128_GROUP_REDUCTION), new BN(95548).toRed(constants.BN128_GROUP_REDUCTION)];
    const bkSelection = [new BN(98584).toRed(constants.BN128_GROUP_REDUCTION), new BN(83498).toRed(constants.BN128_GROUP_REDUCTION), new BN(93741).toRed(constants.BN128_GROUP_REDUCTION)];
    return notes.map((individualNote, i) => {
        // const ba = bn128.randomGroupScalar();
        // bk = bn128.randomGroupScalar();

        if (i === 0) {
            B = individualNote.gamma.mul(bkSelection[0]).add(bn128.h.mul(baSelection[0]));
            console.log('i: ', i, 'B.x: ', B.x.toString());

        } else if (i === 1) {
            x = rollingHash.keccak(constants.BN128_GROUP_REDUCTION);
            const xbk = bkSelection[1].redMul(x);
            const xba = baSelection[1].redMul(x);

            B = individualNote.gamma.mul(xbk).add(bn128.h.mul(xba));
            console.log('i: ', i, 'B.x: ', B.x.toString());
        } else if (i > 1) {
            bk = bkArray[i - 2].redSub(bkArray[i - 1]);
            bkSelection[2] = bk;

            x = rollingHash.keccak(constants.BN128_GROUP_REDUCTION);
            const xbk = bkSelection[2].redMul(x);
            const xba = baSelection[2].redMul(x);


            B = individualNote.gamma.mul(xbk).add(bn128.h.mul(xba));
            console.log('i: ', i, 'B.x: ', B.x.fromRed().toString((16), 64));
            console.log('i: ', i, 'B.y: ', B.y.fromRed().toString((16), 64));
        }
        bkArray.push(bkSelection[i]);

        return {
            B,
            bk: bkSelection[i],
            ba: baSelection[i],
        };
    });
};

/**
 * Construct AZTEC private range proof transcript
 *
 * @method constructProof
 * @param {Object[]} notesWithoutUtility AZTEC notes
 * @param {string} sender the address calling the constructProof() function
 * @returns {string[]} proofData - constructed cryptographic proof data
 * @returns {string} challenge - crypographic challenge variable, part of the sigma protocol
 */
oldPrivateRange.constructProof = (notes, sender) => {
    // const numNotes = 3;
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Keccak();
    const kPublicBN = new BN(0);
    const publicOwner = constants.addresses.ZERO_ADDRESS;

    // proofUtils.parseInputs(notes, sender);
    // proofUtils.checkNumNotes(notes, numNotes, true);

    notes.forEach((individualNote) => {
        rollingHash.appendPoint(individualNote.gamma);
        rollingHash.appendPoint(individualNote.sigma);
    });

    const blindingFactors = oldPrivateRange.constructBlindingFactors(notes, rollingHash);
    // console.log('sender: ', sender);
    // console.log('publicValue: ', kPublicBN);
    // console.log('publicOwner: ', publicOwner);
    // console.log('blindingFactors: ', blindingFactors);
    const challenge = proofUtils.computeChallenge(sender, kPublicBN, publicOwner, notes, blindingFactors);
    console.log('original challenge: ', challenge.fromRed().toString());
    const proofData = blindingFactors.map((blindingFactor, i) => {
        let kBar;

        // Only set the first 2 values of kBar - the third is later inferred
        // from a cryptographic relation. Set the third to 0
        if (i <= 1) {
            kBar = notes[i].k
                .redMul(challenge)
                .redAdd(blindingFactor.bk)
                .fromRed();
        } else {
            kBar = padLeft(new BN(crypto.randomBytes(32), 16).umod(bn128.curve.n).toString(16), 64);
        }
        const aBar = notes[i].a
            .redMul(challenge)
            .redAdd(blindingFactor.ba)
            .fromRed();

        return [
            `0x${padLeft(kBar.toString(16), 64)}`,
            `0x${padLeft(aBar.toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.y.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.y.fromRed().toString(16), 64)}`,
        ];
    });

    // console.log('challenge: ', challenge.toString());

    return {
        proofData,
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

/**
 * Encode a private range proof transaction. It will construct proofData for a private range zero
 * knowledge proof and then ABI encode according to the standard compatible with the ACE.
 *
 * This function can be used in two flows:
 * 1) Default - the default is that only the originalNote and comparisonNote are input
 * 2) Manual - this is when a utility note is manually constructed by the user and passed in as a fourth
 * argument. For some use cases, this is the desired behaviour
 *
 * It is expected that for most functionality, this function will be used in the default flow.
 *
 * @method encodePrivateRangeTransaction
 * @memberof module:privateRange
 * @param {Note[]} originalNote original AZTEC note being to be compared
 * @param {Note[]} comparisonNote note being compared against
 * @param {Note[]} utilityNote (optional) additional note required to construct a valid balancing relationship
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @returns {Object} AZTEC proof data and expected output
 */
// oldPrivateRange.encodePrivateRangeTransaction = async ({ originalNote, comparisonNote, senderAddress, utilityNote }) => {
//     let notes;
//     const utilityNoteVariable = utilityNote || 0;

//     if (!utilityNoteVariable) {
//         notes = await helpers.constructUtilityNote([originalNote, comparisonNote]);
//     } else {
//         notes = [originalNote, comparisonNote, utilityNote];
//     }

//     const inputNotes = [originalNote, comparisonNote];
//     const inputOwners = inputNotes.map((m) => m.owner);
//     const outputNotes = [notes[2]];
//     const outputOwners = [notes[2].owner];

//     const { proofData: proofDataRaw, challenge } = oldPrivateRange.constructProof(notes, senderAddress);

//     const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);
//     const publicOwner = constants.addresses.ZERO_ADDRESS;
//     const publicValue = 0;

//     const expectedOutput = `0x${outputCoder
//         .encodeProofOutputs([
//             {
//                 inputNotes,
//                 outputNotes,
//                 publicOwner,
//                 publicValue,
//                 challenge,
//             },
//         ])
//         .slice(0x42)}`;
//     return { proofData, expectedOutput };
// };

module.exports = oldPrivateRange;
