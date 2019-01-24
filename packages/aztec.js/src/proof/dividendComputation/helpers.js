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

module.exports = helpers;
