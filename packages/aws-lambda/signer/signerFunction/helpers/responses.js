const baseResponse = {
    isBase64Encoded: false,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    },
};

const successResponse = ({ statusCode = 200, data = {}, options: { headers = {} } = {} }) => {
    const responseOptions = {
        ...baseResponse,
        headers: {
            ...baseResponse.headers,
            ...headers,
        },
    };
    return {
        ...responseOptions,
        statusCode,
        body: JSON.stringify({
            data,
        }),
    };
};

const badResponse = ({ statusCode = 400, message = 'Bad request', options: { headers = {} } = {} }) => {
    const responseOptions = {
        ...baseResponse,
        headers: {
            ...baseResponse.headers,
            ...headers,
        },
    };
    return {
        ...responseOptions,
        statusCode,
        body: JSON.stringify({
            error: {
                message,
            },
        }),
    };
};

const OK_200 = (data, options) =>
    successResponse({
        data,
        options,
    });

const BAD_400 = (message, options) =>
    badResponse({
        message,
        options,
    });

const ACCESS_DENIED_401 = (message = 'Access Denied') =>
    badResponse({
        statusCode: 401,
        message,
    });

const NOT_FOUND_404 = (message = 'Not Found') =>
    badResponse({
        statusCode: 404,
        message,
    });

module.exports = {
    OK_200,
    BAD_400,
    ACCESS_DENIED_401,
    NOT_FOUND_404,
};
