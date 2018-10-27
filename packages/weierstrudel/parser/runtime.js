const VM = require('../ethereumjs-vm-tracer/ethereumjs-vm');
const BN = require('bn.js');
const crypto = require('crypto');

const Parser = require('./parser');

// const parser = new Parser();

const bn128Reference = require('../js_snippets/bn128_reference.js');

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
    for ({ index, value } of bnArray) {
        let hex = toBytes32(value.toString(16));
        for (let i = 0; i < hex.length; i += 2) {
            buffer[((i/2) + index)] = new BN(`${hex[i]}${hex[i+1]}`, 16).toNumber();
        }
    }
    return buffer;
}

function Runtime(filename) {
    const parser = new Parser();
    parser.parseFile(filename);
    return async function runMacro(macroName, stack = null, memory = null) {
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
            stack: stack,
            memory: memory ? processMemory(memory) : null,
        });
        if (err) {
            throw new Error(err);
        }
        return { stack: results.runState.stack, memory: results.runState.memory };
    }
}

module.exports = Runtime;