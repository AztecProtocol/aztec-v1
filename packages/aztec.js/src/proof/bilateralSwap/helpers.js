const BN = require('bn.js');

const bn128 = require('../../bn128');
const secp256k1 = require('../../secp256k1');
const notesConstruct = require('../../note');


const { groupReduction } = bn128;


const helpers = {};

helpers.makeTestNotes = (makerNoteValues, takerNoteValues) => {
    const noteValues = [...makerNoteValues, ...takerNoteValues];
    return noteValues.map(value => notesConstruct.create(secp256k1.generateAccount().publicKey, value));
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

helpers.getBlindingFactorsAndChallenge = (noteArray, finalHash) => {
    const bkArray = [];
    const blindingFactors = noteArray.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();

        /*
        Explanation of the below if/else
        - The purpose is to set bk1 = bk3 and bk2 = bk4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All bks are stored in a bkArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding 
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the bkArray, and setting the current
          bk equal to the element at the resulting position.
        */

        // Taker notes
        if (i > 1) {
            bk = bkArray[i - 2];
        }

        const B = note.gamma.mul(bk).add(bn128.h.mul(ba));

        finalHash.append(B);
        bkArray.push(bk);

        return {
            bk,
            ba,
            B,
        };
    });
    const challenge = finalHash.keccak(groupReduction);
    return { blindingFactors, challenge };
};

helpers.recoverBlindingFactorsAndChallenge = (proofDataBn, formattedChallenge, finalHash) => {
    const kBarArray = [];

    // Validate that the commitments lie on the bn128 curve
    proofDataBn.forEach((proofElement) => {
        bn128.curve.validate(proofElement[6]); // checking gamma point
        bn128.curve.validate(proofElement[7]); // checking sigma point
    });

    const recoveredBlindingFactors = proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];

        /*
        Explanation of the below if/else
        - The purpose is to set kBar1 = kBar3 and kBar2 = kBar4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All kBars are stored in a kBarArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding 
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the kBarArray, and setting the current
          kBar equal to the element at the resulting position.
        */

        // Taker notes
        if (i > 1) {
            kBar = kBarArray[i - 2];
        }

        const B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(formattedChallenge).neg());

        finalHash.append(B);
        kBarArray.push(kBar);

        return {
            kBar,
            B,
        };
    });
    const recoveredChallenge = finalHash.keccak(groupReduction);
    return { recoveredBlindingFactors, recoveredChallenge };
};

module.exports = helpers;
