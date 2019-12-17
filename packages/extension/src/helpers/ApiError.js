import merge from 'lodash/merge';
import I18n from '~/utils/I18n';
import makeError from '~/utils/error/makeError';
import defaultErrorConfig from '~/config/error';

let errorHandler;
let prevConfig = null;

export const extendConfig = (errorConfig) => {
    if (!errorConfig || errorConfig === prevConfig) return;

    const errorI18n = new I18n();
    const config = errorConfig === defaultErrorConfig
        ? defaultErrorConfig
        : merge({}, defaultErrorConfig, errorConfig);
    errorI18n.register(config);
    errorHandler = makeError('API', errorI18n);
    prevConfig = errorConfig;
};

export const reset = () => {
    const errorI18n = new I18n();
    errorI18n.register(defaultErrorConfig);
    errorHandler = makeError('API', errorI18n);
    prevConfig = null;
};

extendConfig(defaultErrorConfig);

export default function ApiError(errorMessage, data) {
    const errorObj = typeof errorMessage === 'object'
        ? errorMessage
        : errorHandler(errorMessage, data);

    const {
        error,
        response,
    } = errorObj;
    const {
        type,
        key,
        message,
        response: errorResponse,
    } = error || {};

    this.type = type;
    this.key = key;
    this.message = message;
    this.response = response
        || (typeof errorResponse === 'string' && JSON.parse(errorResponse))
        || errorResponse;
}
