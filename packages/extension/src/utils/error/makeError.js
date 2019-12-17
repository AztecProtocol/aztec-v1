import {
    warnLog,
} from '~/utils/log';

export default function makeError(type, errorI18n) {
    return (key, data) => {
        const {
            messageOptions,
            ...response
        } = data || {};
        let message;
        if (!errorI18n.has(key)) {
            warnLog(`Error '${key}' is not defined.`);
            message = key;
        } else {
            message = errorI18n.t(key, {
                ...data,
                ...messageOptions,
            });
        }
        return {
            error: {
                type,
                key,
                message,
                response,
            },
        };
    };
}
