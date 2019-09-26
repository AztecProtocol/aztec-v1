export default function errorResponse(error) {
    const {
        response,
    } = error;

    return {
        error: {
            ...error.error,
            response: JSON.stringify(response),
        },
    };
}
