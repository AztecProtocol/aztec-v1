
const secp256k1 = require('@aztec/secp256k1');

const note = require('../../note');

const helpers = {};
/**
 * Construct a utility note for the privateRange proof
 * 
 * @dev Utility note is used to construct a balancing relationship
 * for the sigma protocol to prove. Balancing relationship is:
 * 
 * originalNoteValue = comparisonNoteValue + utilityNoteValue
 * 
 * @method constructUtilityNote
 * @memberof module:privateRange
 * @param {Note[]} notesWithoutUtility - array of notes without a utility note. 
 * Specifically, includes originalNote and comparisonNote. 
 * @returns {Note[]} array of AZTEC notes, specifically including originalNote, 
 * comparisonNote and utilityNote
 */
helpers.constructUtilityNote = async (notesWithoutUtility) => {
    let utilityValue;
    const aztecAccount = secp256k1.generateAccount();

    const originalValue = notesWithoutUtility[0].k.toNumber();
    const comparisonValue = notesWithoutUtility[1].k.toNumber();


    if (originalValue > comparisonValue) {
        utilityValue = (originalValue) - (comparisonValue);
    } else if (originalValue < comparisonValue) {
        utilityValue = (comparisonValue) - (originalValue);
    }

    const utilityNote = await note.create(aztecAccount.publicKey, utilityValue);

    const notes = notesWithoutUtility.concat(utilityNote);
    return notes;
};

module.exports = helpers;