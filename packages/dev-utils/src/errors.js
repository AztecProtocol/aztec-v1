const catchAsync = (fn) => {
    return async (req, res, next) => {
        await fn(req, res, next).catch((err) => {
            return next(err);
        });
    };
};

const customError = (errorType, data) => {
    const error = new Error(errorType);
    error.data = data;
    return error;
};

module.exports = {
    catchAsync,
    customError,
};
