import errorConfig, {
    errorTypes,
} from '~config/error';
import I18n from '~utils/I18n';
import {
    warnLog,
} from '~utils/log';

const errorI18n = new I18n();
errorI18n.register(errorConfig);

const makeError = type => (key, errorInfo, response) => {
    let message;
    if (!errorI18n.has(key)) {
        warnLog(`Error '${key}' is not defined.`);
        message = key;
    } else {
        message = errorI18n.t(key, errorInfo);
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

const permissionError = errorHandlers.PERMISSION;
const argsError = errorHandlers.ARGUMENTS;

export {
    permissionError,
    argsError,
};
