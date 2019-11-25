/**
 * Error codes for use during proof construction
 */
const codes = {
    BAD_BLINDING_FACTOR: 'BAD_BLINDING_FACTOR',
    BAD_K: 'BAD_K',
    BALANCING_RELATION_NOT_SATISFIED: 'BALANCING_RELATION_NOT_SATISFIED',
    CHALLENGE_RESPONSE_FAIL: 'CHALLENGE_RESPONSE_FAIL',
    EPOCH_DOES_NOT_EXIST: 'EPOCH_DOES_NOT_EXIST',
    GAMMA_IS_INFINITY: 'GAMMA_IS_INFINTY',
    GAMMA_SIGMA_NOT_ON_CURVE: 'GAMMA_SIGMA_NOT_ON_CURVE',
    INCORRECT_NOTE_NUMBER: 'INCORRECT_NOTE_NUMBER',
    KA_TOO_BIG: 'KA_TOO_BIG',
    KB_TOO_BIG: 'KB_TOO_BIG',
    KPUBLIC_MALFORMED: 'KPUBLIC_MALFORMED',
    M_TOO_BIG: 'M_TOO_BIG',
    NO_ADD_CHALLENGEVAR: 'NO_ADD_CHALLENGEVAR',
    NO_CONTRACT_ADDRESS: 'NO_CONTRACT_ADDRESS',
    NO_CONTRACT_ADDRESSES: 'NO_CONTRACT_ADDRESSES',
    NO_CONTRACT_ARTIFACT: 'NO_CONTRACT_ARTIFACT',
    NOT_ON_CURVE: 'NOT_ON_CURVE',
    NOTE_VALUE_TOO_BIG: 'NOTE_VALUE_TOO_BIG',
    POINT_AT_INFINITY: 'POINT_AT_INFINITY',
    SCALAR_IS_ZERO: 'SCALAR_IS_ZERO',
    SCALAR_TOO_BIG: 'SCALAR_TOO_BIG',
    SHOULD_THROW_IS_UNDEFINED: 'SHOULD_THROW_IS_UNDEFINED',
    SIGMA_IS_INFINTY: 'SIGMA_IS_INFINITY',
    UNSUPPORTED_NETWORK: 'UNSUPPORTED_NETWORK',
    VIEWING_KEY_MALFORMED: 'VIEWING_KEY_MALFORMED',
    X_TOO_BIG: 'X_TOO_BIG',
    Y_TOO_BIG: 'Y_TOO_BIG',
    ZA_TOO_BIG: 'ZA_TOO_BIG',
    ZB_TOO_BIG: 'ZB_TOO_BIG',
};

/**
 * Take in the error to be thrown, throw it and return additional debugging
 * information alongside
 *
 * @class AztecError
 * @param {string} code - the code of the error thrown
 * @param {Object} data - additional debugging information to be thrown alongside the
 * error
 */

class AztecError extends Error {
    constructor(code, data) {
        super(code);
        this.data = data;
    }
}

module.exports = {
    AztecError,
    codes,
};
