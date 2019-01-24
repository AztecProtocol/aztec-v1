const BN = require('bn.js');
const crypto = require('crypto');


const bn128 = require('../../bn128');
const secp256k1 = require('../../secp256k1');
const notesConstruct = require('../../note');


const { groupReduction } = bn128;


const helpers = {};

helpers.makeTestNotes = (makerNoteValues, takerNoteValues) => {
    const noteValues = makerNoteValues.concat(takerNoteValues);
    const numNotes = noteValues.length;

    let i;
    const publicKeys = [];
    for (i = 0; i < numNotes; i += 1) {
        const { publicKey } = secp256k1.accountFromPrivateKey(crypto.randomBytes(32));
        publicKeys.push(publicKey);
    }

    const testNotes = publicKeys.map((publicKey, j) => {
        return notesConstruct.create(publicKey, noteValues[j]);
    });

    return testNotes;
};

helpers.toBnAndAppendPoints = (proofData) => {
    const proofDataBn = proofData.map((proofElement) => {
        // Reconstruct gamma
        const xGamma = new BN(proofElement[2].slice(2), 16).toRed(bn128.curve.red);
        const yGamma = new BN(proofElement[3].slice(2), 16).toRed(bn128.curve.red);
        const gamma = bn128.curve.point(xGamma, yGamma);

        // Reconstruct sigma
        const xSigma = new BN(proofElement[4].slice(2), 16).toRed(bn128.curve.red);
        const ySigma = new BN(proofElement[5].slice(2), 16).toRed(bn128.curve.red);
        const sigma = bn128.curve.point(xSigma, ySigma);

        return [
            new BN(proofElement[0].slice(2), 16).toRed(groupReduction), // kbar
            new BN(proofElement[1].slice(2), 16).toRed(groupReduction), // aBar
            xGamma,
            yGamma,
            xSigma,
            ySigma,
            gamma,
            sigma,
        ];
    });

    return proofDataBn;
};

helpers.checkNumberNotes = (notes, numberExpected) => {
    if (notes.length !== numberExpected) {
        throw new Error('Incorrect number of notes');
    }
};

helpers.makeNoteArray = (notes) => {
    const makerNotes = Object.values(notes.makerNotes);
    const takerNotes = Object.values(notes.takerNotes);
    const noteArray = [makerNotes[0], makerNotes[1], takerNotes[0], takerNotes[1]];
    return noteArray;
};

helpers.makeIncorrectArray = (notes) => {
    const makerNotes = Object.values(notes.makerNotes);
    const takerNotes = Object.values(notes.takerNotes);
    const noteArray = [makerNotes[0], makerNotes[1], makerNotes[2], takerNotes[0], takerNotes[1], takerNotes[2]];
    return noteArray;
};

helpers.validateOnCurve = (x, y) => {
    const rhs = x.redSqr().redMul(x).redAdd(bn128.curve.b);
    const lhs = y.redSqr();
    if (!rhs.fromRed().eq(lhs.fromRed())) {
        throw new Error('point not on the curve');
    }
};

helpers.getBlindingFactorsAndChallenge = (noteArray, finalHash) => {
    const bkArray = [];
    const blindingFactors = noteArray.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;

        /*
        Explanation of the below if/else
        - The purpose is to set bk1 = bk3 and bk2 = bk4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All bks are stored in a bkArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding 
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the bkArray, and setting the current
          bk equal to the element at the resulting position.
        */

        // Maker notes
        if (i <= 1) {
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        } else { // taker notes
            bk = bkArray[i - 2];
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        }
        finalHash.append(B);
        bkArray.push(bk);

        return {
            bk,
            ba,
            B,
        };
    });

    finalHash.keccak();
    const challenge = finalHash.toGroupScalar(groupReduction);
    return { blindingFactors, challenge };
};

helpers.recoverBlindingFactorsAndChallenge = (proofDataBn, formattedChallenge, finalHash) => {
    const kBarArray = [];

    // Validate that the commitments lie on the bn128 curve
    proofDataBn.map((proofElement) => {
        helpers.validateOnCurve(proofElement[2], proofElement[3]); // checking gamma point
        helpers.validateOnCurve(proofElement[4], proofElement[5]); // checking sigma point
    });

    const recoveredBlindingFactors = proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];
        let B;

        /*
        Explanation of the below if/else
        - The purpose is to set kBar1 = kBar3 and kBar2 = kBar4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All kBars are stored in a kBarArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding 
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the kBarArray, and setting the current
          kBar equal to the element at the resulting position.
        */

        // Maker notes
        if (i <= 1) {
            B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(formattedChallenge).neg());
        } else { // taker notes
            kBar = kBarArray[i - 2];
            B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(formattedChallenge).neg());
        }

        finalHash.append(B);
        kBarArray.push(kBar);

        return {
            kBar,
            B,
        };
    });
    finalHash.keccak();
    const recoveredChallenge = finalHash.toGroupScalar(groupReduction);
    return { recoveredBlindingFactors, recoveredChallenge };
};

module.exports = helpers;
