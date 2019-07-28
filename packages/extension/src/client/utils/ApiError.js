export default function ApiError(errorResponse = {}) {
    const {
        error,
        response,
    } = errorResponse;
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
