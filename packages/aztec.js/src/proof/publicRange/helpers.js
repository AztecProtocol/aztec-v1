const secp256k1 = require('@aztec/secp256k1');
const { constants, errors } = require('@aztec/dev-utils');
const note = require('../../note');

const helpers = {};
/**
 * Construct a utility note for the publicRange proof
 *
 * @dev Utility note is used to construct a balancing relationship
 * for the sigma protocol to prove. Balancing relationship is:
 *
 * originalNoteValue = publicComparison + utilityNoteValue
 *
 * @method constructUtilityNote
 * @memberof module:publicRange
 * @param {Note[]} notesWithoutUtility - array of notes without a utility note.
 * Specifically, includes originalNote and comparisonNote.
 * @returns {Note[]} array of AZTEC notes, specifically including originalNote,
 * comparisonNote and utilityNote
 */
helpers.constructUtilityNote = async (originalNote, publicComparison) => {
    let notes;
    let utilityValue;
    const aztecAccount = secp256k1.generateAccount();
    if (originalNote.k !== undefined && publicComparison !== undefined) {
        const originalValue = originalNote.k.toNumber();

        if (originalValue > publicComparison) {
            utilityValue = originalValue - publicComparison;
        } else if (originalValue === publicComparison) {
            utilityValue = 0;
        } else {
            throw errors.customError(constants.errorTypes.INCORRECT_NOTE_RELATION, {
                message: 'notes supplied with comparisonValue being less than originalValue',
                originalValue,
                publicComparison,
            });
        }

        const utilityNote = await note.create(aztecAccount.publicKey, utilityValue);

        notes = [originalNote, utilityNote];
    } else {
        notes = [];
    }

    return notes;
};

/**
 * Check that the publicComparison integer is well formed. Specifically, check that it is positive and
 * that it is an integer.
 * @method checkPublicComparisonWellFormed
 * @param {string[]} publicComparison - array of proof data from proof construction
 */
helpers.checkPublicComparisonWellFormed = (publicComparison) => {
    if (publicComparison < 0) {
        throw errors.customError(constants.errorTypes.PUBLIC_COMPARISON_NEGATIVE, {
            message: 'publicComparison is negative, has to be positive',
            publicComparison,
        });
    }

    if (!helpers.isInteger(publicComparison)) {
        throw errors.customError(constants.errorTypes.NOT_INTEGER, {
            message: 'publicComparison is not an integer, it has to be',
            publicComparison,
            type: typeof publicComparison,
        });
    }
};

/**
 * Check whether publicComparison is an integer
 *
 * @method isFloat
 * @param number - JavaScript number to be checked whether it is a float or not
 * @returns boolean - true if input is an integer, false if it is a float
 */
helpers.isInteger = (number) => {
    return number % 1 === 0;
};

module.exports = helpers;
