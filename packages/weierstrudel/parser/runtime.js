/* eslint-disable no-restricted-syntax */
const BN = require('bn.js');

const Parser = require('./parser');
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

// TODO, fix this
function processMemory(bnArray) {
    const buffer = [];
    console.log('bnArray = ', bnArray);
    for (const { index, value } of bnArray) {
        const hex = toBytes32(value.toString(16));
        for (let i = 0; i < hex.length; i += 2) {
            buffer[((i / 2) + index)] = new BN(`${hex[i]}${hex[i + 1]}`, 16).toNumber();
        }
    }
    return buffer;
}

function Runtime(filename) {
    const parser = new Parser();
    parser.parseFile(filename);
    return async function runMacro(macroName, stack = null, memory = null, data = null) {
        const macro = parser.macros[macroName];
        const { bytecode } = parser.processMacro(macroName);
        const { takes } = macro;
        if (stack.length !== takes) {
            throw new Error(`stack length ${stack.length} does not equal macro takes param ${takes}`);
        }
        const vm = new VM();
        const [err, results] = await vm.runCode({
            code: Buffer.from(bytecode, 'hex'),
            gasLimit: Buffer.from('ffffffff', 'hex'),
            stack,
            memory: memory ? processMemory(memory) : null,
            data: data ? processMemory(data) : null,
        });
        if (err) {
            throw new Error(err);
        }
        const gasSpent = results.runState.gasLimit.sub(results.runState.gasLeft).toString(10);
        console.log('gas consumed = ', gasSpent);
        return { stack: results.runState.stack, memory: results.runState.memory, returnValue: results.runState.returnValue };
    };
}

module.exports = Runtime;
