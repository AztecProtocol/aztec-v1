const { constants } = require('@aztec/dev-utils');

/**
/**
 * Generate a random note value that is less than constants.K_MAX_TEST
 *
 * @method generateNoteValue
 * @returns {BN} - big number instance of an AZTEC note value
 */
const randomNoteValue = () => {
    return Math.floor(Math.random() * constants.K_MAX_TEST);
};

module.exports = {
    randomNoteValue,
};
