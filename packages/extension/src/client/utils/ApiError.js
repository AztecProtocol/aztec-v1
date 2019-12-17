import I18n from '~/utils/I18n';
import makeError from '~/utils/error/makeError';
import errorConfig from '~/client/config/error';

const errorI18n = new I18n();
errorI18n.register(errorConfig);

const errorHandler = makeError('API', errorI18n);

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
