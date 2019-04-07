const utils = require('@aztec/dev-utils');

const joinSplit = require('../joinSplit');

const { errorTypes } = utils.constants;


const verifier = {};

/**
* Verify an AZTEC mint zero-knowledge proof
*
* @method verifyProof
* @memberof module:mint
* @param {string[]} proofData AZTEC join-split zero-knowledge proof data
* @param {number} m number of input notes
* @param {string} challengeHex hex-string formatted proof challenge
* @param {string} sender Ethereum address of transaction sender
*/

verifier.verifyProof = (proofData, challengeHex, sender) => {
    const m = 1;
    let proofDataArray;

    if (!Array.isArray(proofData)) {
        proofDataArray = [proofData];
    } else {
        proofDataArray = proofData;
    }

    const result = joinSplit.verifier.verifyProof(proofData, m, challengeHex, sender);

    const numNotes = proofDataArray.length;

    if (numNotes < 2) {
        result.errors.push(errorTypes.INCORRECT_NOTE_NUMBER);
    }

    return result;
};

module.exports = verifier;
