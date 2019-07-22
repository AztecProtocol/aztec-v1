import errorConfig, {
    errorTypes,
} from '~config/error';
import I18n from '~utils/I18n';
import {
    warnLog,
} from '~utils/log';

const errorI18n = new I18n();
errorI18n.register(errorConfig);

const makeError = type => (key, data) => {
    const {
        messageOptions,
        ...response
    } = data || {};
    let message;
    if (!errorI18n.has(key)) {
        warnLog(`Error '${key}' is not defined.`);
        message = key;
    } else {
        message = errorI18n.t(key, messageOptions);
    }
    return {
        error: {
            type,
            key,
            message,
        },
        response,
    };
};

const errorHandlers = {};
errorTypes.forEach((type) => {
    errorHandlers[type] = makeError(type);
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
    },
    response,
});
