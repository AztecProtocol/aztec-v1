/* eslint-disable no-restricted-syntax */
const BN = require('bn.js');
const VM = require('ethereumjs-vm');

const newParser = require('./parser');
const utils = require('./utils');
const { opcodes } = require('./opcodes/opcodes');

function getNewVM() {
    return new VM({ hardfork: 'constantinople' });
}

function toBytesN(input, len, padding = 'left') {
    // assumes hex format
    let s = input;
    if (s.length > len * 2) {
        throw new Error(`string ${input} is too long!`);
    }
    while (s.length < len * 2) {
        if (padding === 'left') {
            // left pad to hash a number. Right pad to hash a string
            s = `0${s}`;
        } else {
            s = `${s}0`;
        }
    }
    return s;
}

function processMemory(bnArray) {
    var calldatalength = 0;
    for (const {index, value, len} of bnArray) {
        if (index + len > calldatalength) {
            calldatalength = index + len;
        }
    }
    const buffer = new Array(calldatalength).fill(0);
    for (const { index, value, len } of bnArray) {
        const hex = toBytesN(value.toString(16), len);
        for (let i = 0; i < hex.length; i += 2) {
            buffer[i / 2 + index] = parseInt(`${hex[i]}${hex[i + 1]}`, 16);
        }
    }
    return buffer;
}

function getPushOp(hex) {
    const data = utils.formatEvenBytes(hex);
    const opcode = utils.toHex(95 + data.length / 2);
    return `${opcode}${data}`;
}

function encodeMemory(memory) {
    return memory.reduce((bytecode, { index, value }) => {
        const word = getPushOp(value.toString(16));
        const memIndex = getPushOp(Number(index).toString(16));
        return bytecode + `${word}${memIndex}${opcodes.mstore}`;
    }, '');
}

function encodeStack(stack) {
    return stack.reduce((bytecode, word) => {
        const value = getPushOp(word.toString(16));
        return bytecode + `${value}`;
    }, '');
}

function runCode(vm, bytecode, calldata, sourcemapOffset = 0, sourcemap = [], callvalue = 0, callerAddr = 0) {
    if (calldata) {
        for (x of calldata) {
            if (x.len === undefined) {
                x.len = 32; // set len to 32 if undefined (for sake of backward compatibility)
            }
        }
    }
    return new Promise((resolve, reject) => {
        vm.runCode(
            {
                code: Buffer.from(bytecode, 'hex'),
                gasLimit: Buffer.from('ffffffff', 'hex'),
                data: calldata ? processMemory(calldata) : null,
                value: new BN(callvalue),
                caller: callerAddr,
            },
            (err, results) => {
                if (err) {
                    console.log(results.runState.programCounter);
                    console.log(sourcemap[results.runState.programCounter - sourcemapOffset]);
                    return reject(err);
                }
                return resolve(results);
            },
        );
    });
}

function Runtime(filename, path, debug = false) {
    const { inputMap, macros, jumptables } = newParser.parseFile(filename, path);
    return async function runMacro(vm, macroName, stack = [], memory = [], calldata = null, callvalue = 0, callerAddr = 0) {
        const memoryCode = encodeMemory(memory);
        const stackCode = encodeStack(stack);
        const initCode = `${memoryCode}${stackCode}`;
        const initGasEstimate = memory.length * 9 + stack.length * 3;
        const offset = initCode.length / 2;
        const {
            data: { bytecode: macroCode, sourcemap },
        } = newParser.processMacro(macroName, offset, [], macros, inputMap, jumptables); // prettier-ignore
        const bytecode = `${initCode}${macroCode}`;
        const results = await runCode(vm, bytecode, calldata, offset, sourcemap, callvalue, callerAddr);
        const gasSpent = results.runState.gasLimit
            .sub(results.runState.gasLeft)
            .sub(new BN(initGasEstimate))
            .toString(10);
        if (debug) {
            console.log('code size = ', macroCode.length / 2);
            console.log('gas consumed = ', gasSpent);
        }
        return {
            gas: gasSpent,
            stack: results.runState.stack,
            memory: results.runState.memory,
            returnValue: results.runState.returnValue,
            bytecode: macroCode,
        };
    };
}

module.exports.Runtime = Runtime;
module.exports.getNewVM = getNewVM;
