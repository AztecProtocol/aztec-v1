const { constants } = require('@aztec/dev-utils');
const { note } = require('aztec.js');

/**
 * Generate a random note value that is less than constants.K_MAX_TEST
 *
 * @method generateNoteValue
 * @returns {BN} - big number instance of an AZTEC note value
 */
const randomNoteValue = () => {
    return Math.floor(Math.random() * constants.K_MAX_TEST);
};

/**
 * Generate a input and output notes given some input and output note values.
 *
 * @method getNotesForAccount
 * @param {Object} aztecAccount - object containint pvtKey, publicKey, account
 * @param {Number[]} noteValues -  array containing note values
 * @returns {Object[]} - an object containing inputNotes[] and outputNotes[] (arrays of Note objects)
 */
const getNotesForAccount = async (aztecAccount, noteValues = []) => {
    return Promise.all(noteValues.map((inputNoteValue) => note.create(aztecAccount.publicKey, inputNoteValue)));
};

module.exports = {
    randomNoteValue,
    getNotesForAccount,
};
