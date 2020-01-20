import errorConfig, {
    errorTypes,
} from '~/config/error';
import I18n from '~/utils/I18n';
import makeError from './makeError';

const errorI18n = new I18n();
errorI18n.register(errorConfig);

// Construct errorHandlers from errorTypes in config/constants
// so that we can be sure each exported handler will have a valid type.
// They will be undefined if the type is not available.
const errorHandlers = {};
errorTypes.forEach((type) => {
    errorHandlers[type] = makeError(type, errorI18n);
});
export const permissionError = errorHandlers.PERMISSION;
export const argsError = errorHandlers.ARGUMENTS;
export const dataError = errorHandlers.DATA;

// should prevent using this
export const unknownError = (message, response) => ({
    error: {
        type: 'UNKNOWN',
        key: message,
        message,
        response,
    },
});
