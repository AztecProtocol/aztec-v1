import I18n from '~utils/I18n';
import makeError from '~utils/error/makeError';
import errorConfig from '~ui/config/error';

const errorI18n = new I18n();
errorI18n.register(errorConfig);

const errorHandler = makeError('UI', errorI18n);

export default function UIError(errorMessage, data) {
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
        response: responseStr,
    } = error || {};

    this.type = type;
    this.key = key;
    this.message = message;
    this.response = response
        || (responseStr && JSON.parse(responseStr));
}
