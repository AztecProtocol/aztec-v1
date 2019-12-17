import I18n from '~/utils/I18n';
import makeError from '~/utils/error/makeError';
import errorConfig from '~/client/config/error';

const errorI18n = new I18n();
errorI18n.register(errorConfig);

const errorHandler = makeError('CONTRACT', errorI18n);

export default function ContractError(key, data) {
    const {
        error: {
            type,
            message,
        },
        response,
    } = errorHandler(key, data);

    this.type = type;
    this.key = key;
    this.message = message;
    this.response = response;
}
