const customError = (errorType, data) => {
    const error = new Error(errorType);
    error.data = data;
    return error;
};

// const abc = 5;
// const abcd = 5;
// const abcdev = 5;

module.exports = {
    customError,
};
