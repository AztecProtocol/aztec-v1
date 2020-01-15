function errorLog(...args) {
    if (process.env.NODE_ENV !== 'production') {
        console.error(...args); // eslint-disable-line no-console
    }
}

function log(...args) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(...args); // eslint-disable-line no-console
    }
}

function warnLog(...args) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(...args); // eslint-disable-line no-console
    }
}

module.exports = {
    errorLog,
    log,
    warnLog,
};
