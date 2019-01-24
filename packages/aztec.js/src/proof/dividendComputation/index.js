const BN = require('bn.js');
const { padLeft } = require('web3-utils');


const Keccak = require('../../keccak');
const bn128 = require('../../bn128');
const helpers = require('./helpers');
const { K_MAX } = require('../../params');


const { groupReduction } = bn128;


/**
 * Constructs AZTEC dividend computations
 *
 * @module dividendComputation
*/
const dividendComputation = {};
dividendComputation.helpers = helpers;

/**
 * Construct AZTEC dividend computation proof transcript
 *
 * @method constructProof
 * @param {Array[Note]} notes array of AZTEC notes
 * @returns {{proofData:Array[string]}, {challenge: string}} - proof data and challenge
 */
dividendComputation.constructProof = (notes, za, zb, sender) => {
    // Array to store bk values later
    const bkArray = [];
    // convert z_a and z_b into BN instances if they aren't already
    let zaBN;
    let zbBN;

    // finalHash is used to create final proof challenge
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

    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    // finalHash is used to create final proof challenge
    const finalHash = new Keccak();
    finalHash.appendBN(new BN(sender.slice(2), 16));
    finalHash.appendBN(zaBN);
    finalHash.appendBN(zbBN);
    finalHash.data = [...finalHash.data, ...rollingHash.data];
    rollingHash.keccak();

    const blindingFactors = notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;
        let x = new BN(0).toRed(groupReduction);
        x = rollingHash.toGroupScalar(groupReduction);

        // Calculating the blinding factors
        if (i === 0) { // input note
            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x
            rollingHash.keccak();

            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(bk);
        }

        if (i === 1) { // output note
            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x
            rollingHash.keccak();
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(bk);
        }

        if (i === 2) { // residual note
            const zbRed = zbBN.toRed(groupReduction);
            const zaRed = zaBN.toRed(groupReduction);

            // bk_3 = (z_b)(bk_1) - (z_a)(bk_2)
            bk = (zbRed.redMul(bkArray[0])).redSub(zaRed.redMul(bkArray[1]));

            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x

            rollingHash.keccak();
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(bk);
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

/**
 * Verify AZTEC dividend computation proof transcript
 *
 * @method verifyProof
 * @param {Array[proofData]} proofData - proofData array of AZTEC notes
 * @param {big number instance} challenge - challenge variable used in zero-knowledge protocol
 * @returns {number} - returns 1 if proof is validated, throws an error if not
 */
dividendComputation.verifyProof = (proofData, challenge, sender, za, zb) => {
    let zaBN;
    let zbBN;
    const K_MAXBN = new BN(K_MAX);
    const kBarArray = [];

    // toBnAndAppendPoints appends gamma and sigma to the end of proofdata as well
    const proofDataBn = helpers.toBnAndAppendPoints(proofData);

    const formattedChallenge = (new BN(challenge.slice(2), 16)).toRed(groupReduction);

    // Check that proof data lies on the bn128 curve
    proofDataBn.map((proofElement) => {
        helpers.validateOnCurve(proofElement[2], proofElement[3]); // checking gamma point
        helpers.validateOnCurve(proofElement[4], proofElement[5]); // checking sigma point
    });

    // convert to bn.js instances if not already
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

    // Check that za and zb are less than k_max
    if (zaBN.gte(K_MAXBN)) {
        throw new Error('z_a is greater than or equal to kMax');
    }

    if (zbBN.gte(K_MAXBN)) {
        throw new Error('z_b is greater than or equal to kMax');
    }

    const rollingHash = new Keccak();

    // Append note data to rollingHash
    proofDataBn.forEach((proofElement) => {
        rollingHash.append(proofElement[6]);
        rollingHash.append(proofElement[7]);
    });

    // Create finalHash and append to it - in same order as the proof construction code (otherwise final hash will be different)
    const finalHash = new Keccak();
    finalHash.appendBN(new BN(sender.slice(2), 16));
    finalHash.appendBN(zaBN);
    finalHash.appendBN(zbBN);
    finalHash.data = [...finalHash.data, ...rollingHash.data];
    rollingHash.keccak();

    proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];
        let B;

        let x = new BN(0).toRed(groupReduction);
        x = rollingHash.toGroupScalar(groupReduction);

        if (i === 0) { // input note
            const kBarX = kBar.redMul(x); // xbk = bk*x
            const aBarX = aBar.redMul(x); // xba = ba*x
            const challengeX = formattedChallenge.mul(x);
            rollingHash.keccak();
            B = gamma.mul(kBarX).add(bn128.h.mul(aBarX)).add(sigma.mul(challengeX).neg());
            kBarArray.push(kBar);
        }

        if (i === 1) { // output note
            const aBarX = aBar.redMul(x);
            const kBarX = kBar.redMul(x);
            const challengeX = formattedChallenge.mul(x);
            rollingHash.keccak();
            B = gamma.mul(kBarX).add(bn128.h.mul(aBarX)).add(sigma.mul(challengeX).neg());
            kBarArray.push(kBar);
        }

        if (i === 2) { // residual note
            const zbRed = zbBN.toRed(groupReduction);
            const zaRed = zaBN.toRed(groupReduction);

            // kBar_3 = (z_b)(kBar_1) - (z_a)(kBar_2)
            kBar = (zbRed.redMul(kBarArray[0])).redSub(zaRed.redMul(kBarArray[1]));

            const aBarX = aBar.redMul(x);
            const kBarX = kBar.redMul(x);
            const challengeX = formattedChallenge.redMul(x);
            rollingHash.keccak();

            B = gamma.mul(kBarX).add(bn128.h.mul(aBarX)).add(sigma.mul((challengeX).neg()));
            kBarArray.push(kBar);
        }

        finalHash.append(B);
        return {
            kBar,
            B,
        };
    });
    const recoveredChallenge = finalHash.keccak(groupReduction);

    const finalChallenge = `0x${padLeft(recoveredChallenge.toString(16), 64)}`;

    // Check if the recovered challenge, matches the original challenge. If so, proof construction is validated
    if (finalChallenge !== challenge) {
        throw new Error('proof validation failed');
    } else {
        return true;
    }
};

module.exports = dividendComputation;
