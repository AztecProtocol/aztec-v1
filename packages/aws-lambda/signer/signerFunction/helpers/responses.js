const baseResponse = {
    isBase64Encoded: false,
    'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    },
};

const successResponse = ({
    statusCode = 200,
    data = {},
}) => {
    return {
        ...baseResponse,
        statusCode,
        body: JSON.stringify({
            data,
        }),
    };
};

const badResponse = ({
    statusCode = 400,
    message = 'Bad request',
}) => {
    return {
        ...baseResponse,
        statusCode,
        body: JSON.stringify({
            error: {
                message,
            },
        }),
    };
};

const OK_200 = (data) => successResponse({
    data,
});

const BAD_400 = (message) => badResponse({
    message,
});

const ACCESS_DENIED_401 = (message = 'Access Denied') => badResponse({
    message,
});


module.exports = {
    OK_200,
    BAD_400,
    ACCESS_DENIED_401,
};
