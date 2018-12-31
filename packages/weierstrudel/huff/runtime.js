/* eslint-disable no-restricted-syntax */
const BN = require('bn.js');

const newParser = require('./parser');
const utils = require('./utils');
const { opcodes } = require('./opcodes/opcodes');
const VM = require('../ethereumjs-vm-tracer/ethereumjs-vm');

function toBytes32(input, padding = 'left') { // assumes hex format
    let s = input;
    if (s.length > 64) {
        throw new Error(`string ${input} is more than 32 bytes long!`);
    }
    while (s.length < 64) {
        if (padding === 'left') { // left pad to hash a number. Right pad to hash a string
            s = `0${s}`;
        } else {
            s = `${s}0`;
        }
    }
    return s;
}

function processMemory(bnArray) {
    const buffer = [];
    for (const { index, value } of bnArray) {
        const hex = toBytes32(value.toString(16));
        for (let i = 0; i < hex.length; i += 2) {
            buffer[((i / 2) + index)] = parseInt(`${hex[i]}${hex[i + 1]}`, 16);
        }
    }
    return buffer;
}

function getPushOp(hex) {
    const data = utils.formatEvenBytes(hex);
    const opcode = utils.toHex(95 + (data.length / 2));
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

function Runtime(filename, path) {
    const { inputMap, macros } = newParser.parseFile(filename, path);
    return async function runMacro(macroName, stack = [], memory = [], calldata = null) {
        const memoryCode = encodeMemory(memory);
        const stackCode = encodeStack(stack);
        const initCode = `${memoryCode}${stackCode}`;
        const initGasEstimate = (memory.length * 9) + (stack.length * 3);
        const offset = initCode.length / 2;
        const { bytecode: macroCode } = newParser.processMacro(macroName, offset, [], macros, inputMap);
        const bytecode = `${initCode}${macroCode}`;
        const vm = new VM();
        console.log('bytecode byte length = ', Math.ceil(macroCode.length / 2));
        const [err, results] = await vm.runCode({
            code: Buffer.from(bytecode, 'hex'),
            gasLimit: Buffer.from('ffffffff', 'hex'),
            data: calldata ? processMemory(calldata) : null,
        });
        if (err) {
            throw new Error(err);
        }
        const gasSpent = results.runState.gasLimit.sub(results.runState.gasLeft).sub(new BN(initGasEstimate)).toString(10);
        console.log('gas consumed = ', gasSpent);
        return {
            gas: gasSpent,
            stack: results.runState.stack,
            memory: results.runState.memory,
            returnValue: results.runState.returnValue,
        };
    };
}

module.exports = Runtime;
