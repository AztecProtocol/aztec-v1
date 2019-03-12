const customError = (errorType, data) => {
    const error = new Error(errorType);
    error.data = data;
    return error;
};

module.exports = {
    customError,
};
