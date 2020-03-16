export function errorLog(...args) {
    if (process.env.NODE_ENV !== 'production') {
        console.error(...args); // eslint-disable-line no-console
    }
}

export function warnLog(...args) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(...args); // eslint-disable-line no-console
    }
}

export function log(...args) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(...args); // eslint-disable-line no-console
    }
}

export function errorLogProduction(...args) {
    console.error(...args); // eslint-disable-line no-console
}

export function warnLogProduction(...args) {
    console.warn(...args); // eslint-disable-line no-console
}

export default log;
