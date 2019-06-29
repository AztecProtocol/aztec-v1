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
 * originalNoteValue = publicInteger + utilityNoteValue
 *
 * @method constructUtilityNote
 * @memberof module:publicRange
 * @param {Note[]} originalNote - note whose value is being compared to publicInteger
 * @param {Integer} publicInteger - publicInteger which the originalNote is being compared against
 * @returns {Note[]} array of AZTEC notes; specifically including originalNote,
 * comparisonNote and utilityNote
 */
helpers.constructUtilityNote = async (originalNote, publicInteger) => {
    let notes = [];
    let utilityValue;

    const aztecAccount = secp256k1.generateAccount();
    if (originalNote.k !== undefined && publicInteger !== undefined) {
        const originalValue = originalNote.k.toNumber();

        if (originalValue > publicInteger) {
            utilityValue = originalValue - publicInteger;
        } else if (originalValue === publicInteger) {
            utilityValue = 0;
        } else {
            throw errors.customError(constants.errorTypes.INCORRECT_NOTE_RELATION, {
                message: 'notes supplied with publicInteger being less than originalValue',
                originalValue,
                publicInteger,
            });
        }
        const utilityNote = await note.create(aztecAccount.publicKey, utilityValue);
        notes = [originalNote, utilityNote];
    }
    return notes;
};

/**
 * Check that the publicInteger integer is well formed. Specifically, check that it is positive and
 * that it is an integer.
 * @method checkpublicIntegerWellFormed
 * @param {string[]} publicInteger - array of proof data from proof construction
 */
helpers.checkpublicIntegerWellFormed = (publicInteger) => {
    if (publicInteger < 0) {
        throw errors.customError(constants.errorTypes.PUBLIC_COMPARISON_NEGATIVE, {
            message: 'publicInteger is negative, has to be positive',
            publicInteger,
        });
    }

    if (!helpers.isInteger(publicInteger)) {
        throw errors.customError(constants.errorTypes.NOT_INTEGER, {
            message: 'publicInteger is not an integer, it has to be',
            publicInteger,
            type: typeof publicInteger,
        });
    }
};

/**
 * Check whether publicInteger is an integer
 *
 * @method isFloat
 * @param number - JavaScript number to be checked whether it is a float or not
 * @returns boolean - true if input is an integer, false if it is a float
 */
helpers.isInteger = (number) => {
    return number % 1 === 0;
};

module.exports = helpers;
