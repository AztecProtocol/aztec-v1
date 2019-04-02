/**
 * Manage exceptions thrown by smart contracts 
 * @module Exceptions
 */

// from https://ethereum.stackexchange.com/questions/48627/how-to-catch-revert-error-in-truffle-test-javascript
const { expect } = require('chai');

const PREFIX = 'Returned error: VM Exception while processing transaction: ';

/**
 * tryCatch block for managing errors thrown by an eventual promise resolution from a 
 * smart contract
 * @method tryCatch
 * @param {Promise<string>} promise - promise representing the eventual outcome of an 
 * asynchronous smart contract operation
 * @param {string} message - exception error message to be thrown
 */
async function tryCatch(promise, message) {
    try {
        await promise;
        throw new Error();
    } catch (error) {
        expect(error, 'Expected an error but did not get one');
        expect(error.message.startsWith(PREFIX + message))
            .to.equal(true, `Expected an error starting with '${PREFIX}${message}', but got '${error.message}' instead`);
    }
}

module.exports = {
    catchRevert: async (promise) => { await tryCatch(promise, 'revert'); },
    catchOutOfGas: async (promise) => { await tryCatch(promise, 'out of gas'); },
    catchInvalidJump: async (promise) => { await tryCatch(promise, 'invalid JUMP'); },
    catchInvalidOpcode: async (promise) => { await tryCatch(promise, 'invalid opcode'); },
    catchStackOverflow: async (promise) => { await tryCatch(promise, 'stack overflow'); },
    catchStackUnderflow: async (promise) => { await tryCatch(promise, 'stack underflow'); },
    catchStaticStateChange: async (promise) => { await tryCatch(promise, 'static state change'); },
};
