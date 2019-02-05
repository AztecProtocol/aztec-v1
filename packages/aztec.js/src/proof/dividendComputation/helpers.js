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

module.exports = helpers;
