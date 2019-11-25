const { note } = require('aztec.js');

const utils = {};

/**
 * Make the first letter of a given single word input string capitalised
 *
 * @capitaliseFirstChar
 * @param {string} stringToCapitalise - input for which the first letter should be capitalised
 *
 * @returns {string} - input string with first letter capitalised
 */
utils.capitaliseFirstChar = (stringToCapitalise) => {
    return stringToCapitalise.charAt(0).toUpperCase() + stringToCapitalise.slice(1);
};

/**
 * Generate a set of notes, given the desired note values and account of the owner
 *
 * @method getNotesForAccount
 * @param {Object} aztecAccount - Ethereum account that owns the notes to be created
 * @param {Number[]} noteValues - array of note values, for which notes will be created
 * @returns {Note[]} - array of notes
 */
utils.getNotesForAccount = async (aztecAccount, noteValues) => {
    return Promise.all(noteValues.map((noteValue) => note.create(aztecAccount.publicKey, noteValue)));
};

/**
 * Generate a factory ID based on three supplied uint8's: epoch, cryptoSystem and
 * assetType
 *
 * @method generateFactoryId
 * @param {Number} epoch - uint8 representing factory version control
 * @param {Number} cryptoSystem - uint8 representing the cryptosystem the factory is associated with
 * @param {Number} assetType - uint8 representing the type of the asset i.e. is it convertible,
 * adjustable
 */
utils.generateFactoryId = (epoch, cryptoSystem, assetType) => {
    return epoch * 256 ** 2 + cryptoSystem * 256 ** 1 + assetType * 256 ** 0;
};

module.exports = utils;
