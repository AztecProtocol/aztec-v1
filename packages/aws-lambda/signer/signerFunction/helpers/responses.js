const successResponse = ({
    code = 200,
    data = {},
}) => {
    return {
        code,
        body: JSON.stringify({
            data,
        }),
    };
};

const badResponse = ({
    code = 400,
    message = 'Bad request',
}) => {
    return {
        code,
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
