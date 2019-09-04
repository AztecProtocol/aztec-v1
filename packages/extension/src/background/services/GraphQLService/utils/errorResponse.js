export default function errorResponse(error) {
    const {
        response,
    } = error.error;

    return {
        error: {
            ...error.error,
            response: JSON.stringify(response),
        },
    };
}
