const secp256k1 = require('@aztec/secp256k1');
const { constants, errors } = require('@aztec/dev-utils');
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
    let notes;
    let utilityValue;
    const aztecAccount = secp256k1.generateAccount();
    if (notesWithoutUtility[0].k !== undefined && notesWithoutUtility[1].k !== undefined) {
        const originalValue = notesWithoutUtility[0].k.toNumber();
        const comparisonValue = notesWithoutUtility[1].k.toNumber();

        if (originalValue > comparisonValue) {
            utilityValue = originalValue - comparisonValue;
        } else if (originalValue === comparisonValue) {
            utilityValue = comparisonValue;
        } else {
            throw errors.customError(constants.errorTypes.INCORRECT_NOTE_RELATION, {
                message: 'notes supplied with comparisonValue being less than originalValue',
                originalValue,
                comparisonValue,
            });
        }

        const utilityNote = await note.create(aztecAccount.publicKey, utilityValue);

        notes = notesWithoutUtility.concat(utilityNote);
    } else {
        notes = [];
    }

    return notes;
};

module.exports = helpers;
