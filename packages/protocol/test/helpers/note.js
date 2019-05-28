const { constants } = require('@aztec/dev-utils');

/**
 * Generate a random note value that is less than K_MAX
 *
 * @method randomNoteValue
 * @returns {BN} - big number instance of an AZTEC note value
 */
const randomNoteValue = () => {
    return Math.floor(Math.random() * constants.K_MAX);
};

module.exports = {
    randomNoteValue,
};
