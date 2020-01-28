import { constants, errors } from '@aztec/dev-utils';

const helpers = {};

/**
 * Check that the publicComparison integer is well formed. Specifically, check that it is positive and
 * that it is an integer.
 * @method checkPublicComparisonWellFormed
 * @param {Number} publicComparison - publicly visible integer, against which an AZTEC note is being compared
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
 * @method isInteger
 * @param {Number} number - JavaScript number to be checked whether it is a float or not
 * @returns boolean - true if input is an integer, false if it is a float
 */
helpers.isInteger = (number) => {
    return number % 1 === 0;
};

export default helpers;
