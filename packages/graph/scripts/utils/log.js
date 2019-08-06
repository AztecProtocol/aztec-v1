/* eslint-disable no-console */
import chalk from 'chalk';

const formatLog = (title, rest) => {
    console.log(title);
    if (rest.length > 0) {
        console.log(...rest.map(msg => chalk.gray(msg)));
    }
};

export const successLog = (...args) => {
    const [message, ...rest] = args;
    formatLog(chalk.green(message), rest);
};

export const warnLog = (...args) => {
    const [message, ...rest] = args;
    formatLog(chalk.yellow.bold(message), rest);
};

export const errorLog = (...args) => {
    const [message, ...rest] = args;
    console.log('');
    formatLog(chalk.white.bgRed.bold(` ${message.trim()} `), rest);
    console.log('');
};

export const log = (...args) => {
    console.log(...args);
};

export const logEntries = (entries) => {
    log(`\n${entries.map(entry => `    ${entry}`).join('\n')}`);
};

export default log;
