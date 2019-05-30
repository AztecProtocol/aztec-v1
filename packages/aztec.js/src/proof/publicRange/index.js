/**
 * Constructs AZTEC dividend computations
 *
 * @module publicRange
 */

const devUtils = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const helpers = require('./helpers');
const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const proofUtils = require('../proofUtils');
const verifier = require('./verifier');

const { inputCoder, outputCoder } = require('../../abiEncoder');

const { customError } = devUtils.errors;
const { errorTypes } = devUtils.constants;
const { groupReduction } = bn128;

const publicRange = {};
publicRange.verifier = verifier;

/**
 * Construct blinding factors for the public range proof
 *
 * @method constructBlindingFactors
 * @param {Object[]} notes AZTEC notes
 * @param {Object} rollingHash hash containing note coordinates (gamma, sigma)
 * @returns {Object[]} blinding factors
 */
publicRange.constructBlindingFactors = (notes, rollingHash) => {
    const bkArray = [];

    let x = new BN(0).toRed(groupReduction);
    return notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;

        if (i === 0) {
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            bkArray.push(bk);
        }

        if (i > 0) {
            x = rollingHash.keccak(groupReduction);
            bk = bkArray[i - 1];
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(xbk);
        }
        return {
            bk,
            ba,
            B,
        };
    });
};

/**
 * Construct AZTEC public range proof transcript
 *
 * @method constructProof
 * @param {Object[]} notes - array of AZTEC notes
 * @param {Number} publicComparison - public integer against which the comparison is being made
 * @param {sender} sender - Ethereum address
 * @returns {string[]} proofData - constructed cryptographic proof data
 * @returns {string} challenge - crypographic challenge variable, part of the sigma protocol
 */
publicRange.constructProof = (notes, publicComparison, sender) => {
    let publicComparisonBN;
    const numNotes = 2;
    const kPublicBN = new BN(0);
    const publicOwner = devUtils.constants.addresses.ZERO_ADDRESS;
    const rollingHash = new Keccak();

    // Used to check the number of input notes. Boolean argument specifies whether the
    // check should throw if not satisfied, or if we seek to collect all errors
    // and only throw at the end. Here, set to true - immediately throw if error
    proofUtils.checkNumNotes(notes, numNotes, true);
    proofUtils.parseInputs(notes, sender);

    if (BN.isBN(publicComparison)) {
        publicComparisonBN = publicComparison;
    } else {
        publicComparisonBN = new BN(publicComparison);
    }
    // Check that proof data lies on the bn128 curve
    notes.forEach((note) => {
        const gammaOnCurve = bn128.curve.validate(note.gamma); // checking gamma point
        const sigmaOnCurve = bn128.curve.validate(note.sigma); // checking sigma point

        if (gammaOnCurve === false || sigmaOnCurve === false) {
            throw customError(errorTypes.NOT_ON_CURVE, {
                message: 'A group element is not on the bn128 curve',
                gammaOnCurve,
                sigmaOnCurve,
                note,
            });
        }
    });

    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    const blindingFactors = publicRange.constructBlindingFactors(notes, rollingHash);
    const challenge = proofUtils.computeChallenge(sender, publicComparisonBN, kPublicBN, publicOwner, notes, blindingFactors);
    const proofData = blindingFactors.map((blindingFactor, i) => {
        const kBar = notes[i].k
            .redMul(challenge)
            .redAdd(blindingFactor.bk)
            .fromRed();
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

    return {
        proofData,
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

/**
 * Encode a public range proof transaction. It will construct proofData for a public range zero
 * knowledge proof and then ABI encode according to the standard compatible with the ACE.
 *
 * This function can be used in two flows:
 * 1) Default - the default is that in terms of notes, only the originalNote is input
 * 2) Manual - this is when a utility note is manually constructed by the user and passed in as a fourth
 * argument. For some use cases, this is the desired behaviour
 *
 * It is expected that for most functionality, this function will be used in the default flow.
 *
 * Note that this proof is capable of
 *
 * @method encodePublicRangeTransaction
 * @memberof module:publicRange
 * @param {Note[]} originalNote original AZTEC note being to be compared
 * @param {Number} publicComparison public integer against which the comparison is being made. Must be positive and an integer
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @param {bool} isGreaterOrEqual boolean controlling whether this is a greater than or less than proof. If true, then the proof
 * data constructed is for originalNoteValue > publicComparisonValue. If false, then the proof data constructed is for
 * originalNoteValue < publicComparisonValue.
 * @param {Note[]} utilityNote (optional) additional note required to construct a valid balancing relationship
 * @returns {Object} AZTEC proof data and expected output
 */
publicRange.encodePublicRangeTransaction = async ({
    originalNote,
    publicComparison,
    senderAddress,
    isGreaterOrEqual,
    utilityNote,
}) => {
    let notes;
    const utilityNoteVariable = utilityNote || 0;
    let signedPublicComparison;

    helpers.checkPublicComparisonWellFormed(publicComparison);

    if (!isGreaterOrEqual) {
        signedPublicComparison = publicComparison * -1;
    } else {
        signedPublicComparison = publicComparison;
    }

    if (!utilityNoteVariable) {
        notes = await helpers.constructUtilityNote(originalNote, signedPublicComparison);
    } else {
        notes = [originalNote, utilityNote];
    }

    const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, signedPublicComparison, senderAddress);

    const inputNotes = [notes[0]];
    const inputOwners = [notes[0].owner];
    const outputNotes = [notes[1]];
    const outputOwners = [notes[1].owner];

    const proofData = inputCoder.publicRange(
        proofDataRaw,
        challenge,
        signedPublicComparison,
        inputOwners,
        outputOwners,
        outputNotes,
    );

    const publicOwner = devUtils.constants.addresses.ZERO_ADDRESS;
    const publicValue = 0;

    const expectedOutput = `0x${outputCoder
        .encodeProofOutputs([
            {
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue,
                challenge,
            },
        ])
        .slice(0x42)}`;

    return { proofData, expectedOutput };
};

module.exports = publicRange;
