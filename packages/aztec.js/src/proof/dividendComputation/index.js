/**
 * Constructs AZTEC dividend computations
 *
 * @module proof.dividendComputation
*/

const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const Keccak = require('../../keccak');
const bn128 = require('../../bn128');
const verifier = require('./verifier');
const proofUtils = require('../proofUtils');

const {
    inputCoder,
    outputCoder,
} = require('../../abiEncoder');

const { groupReduction } = bn128;
const { customError } = utils.errors;
const { errorTypes } = utils.constants;

const dividendComputation = {};
dividendComputation.verifier = verifier;


/**
 * Construct AZTEC dividend computation proof transcript
 *
 * @method constructProof
 * @param {Object[]} notes - array of AZTEC notes
 * @param {integer} za - integer required to represent ratio in a compatible form with finite-field arithmetic
 * @param {integer} zb - integer required to represent ratio in a compatible form with finite-field arithmetic
 * @param {sender} sender - Ethereum address
 * @returns {{proofData:string[], challenge: string}} - proof data and challenge
 */
dividendComputation.constructProof = (notes, za, zb, sender) => {
    const numNotes = 3;

    // Used to check the number of input notes. Boolean argument specifies whether the 
    // check should throw if not satisfied, or if we seek to collect all errors 
    // and only throw at the end. Here, set to true - immediately throw if error
    proofUtils.checkNumNotes(notes, numNotes, true);

    proofUtils.parseInputs(notes, sender);
    // Array to store bk values later
    const bkArray = [];
    // convert z_a and z_b into BN instances if they aren't already
    let zaBN;
    let zbBN;

    const rollingHash = new Keccak();

    if (BN.isBN(za)) {
        zaBN = za;
    } else {
        zaBN = new BN(za);
    }

    if (BN.isBN(zb)) {
        zbBN = zb;
    } else {
        zbBN = new BN(zb);
    }
    // Check that proof data lies on the bn128 curve
    notes.forEach((note) => {
        const gammaOnCurve = bn128.curve.validate(note.gamma); // checking gamma point
        const sigmaOnCurve = bn128.curve.validate(note.sigma); // checking sigma point

        if ((gammaOnCurve === false) || (sigmaOnCurve === false)) {
            throw customError(
                errorTypes.NOT_ON_CURVE,
                {
                    message: 'A group element is not on the bn128 curve',
                    gammaOnCurve,
                    sigmaOnCurve,
                    note,
                }
            );
        }
    });

    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    let x = new BN(0).toRed(groupReduction);
    x = rollingHash.keccak(groupReduction);

    const blindingFactors = notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;

        // Calculating the blinding factors
        if (i === 0) { // input note
            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x
            x = rollingHash.keccak(groupReduction);
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(bk);
        }

        if (i === 1) { // output note
            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            x = rollingHash.keccak(groupReduction);
            bkArray.push(bk);
        }

        if (i === 2) { // residual note
            const zbRed = zbBN.toRed(groupReduction);
            const zaRed = zaBN.toRed(groupReduction);

            // bk_3 = (z_b)(bk_1) - (z_a)(bk_2)
            bk = (zbRed.redMul(bkArray[0])).redSub(zaRed.redMul(bkArray[1]));

            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x

            x = rollingHash.keccak(groupReduction);
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(bk);
        }

        return {
            bk,
            ba,
            B,
        };
    });

    const challenge = proofUtils.computeChallenge(sender, zaBN, zbBN, notes, blindingFactors);
    const proofDataUnformatted = blindingFactors.map((blindingFactor, i) => {
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

    // Manipulating proofData into the array format required by the smart contract verifier
    const proofData = [...proofDataUnformatted[0], ...proofDataUnformatted[1], ...proofDataUnformatted[2]];
    return {
        proofDataUnformatted, // this has 6 elements
        proofData, // this has 18 elements
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

dividendComputation.encodeDividendComputationTransaction = ({
    inputNotes,
    outputNotes,
    za,
    zb,
    senderAddress,
}) => {
    const {
        proofData: proofDataRaw,
        challenge,
    } = dividendComputation.constructProof([...inputNotes, ...outputNotes], za, zb, senderAddress);

    const inputOwners = inputNotes.map(m => m.owner);
    const outputOwners = outputNotes.map(n => n.owner);
    const publicOwner = '0x0000000000000000000000000000000000000000';
    const publicValue = 0;

    const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12), proofDataRaw.slice(12, 18)]);

    const proofData = inputCoder.dividendComputation(
        proofDataRawFormatted,
        challenge,
        za,
        zb,
        inputOwners,
        outputOwners,
        outputNotes
    );

    const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput, challenge };
};

module.exports = dividendComputation;
