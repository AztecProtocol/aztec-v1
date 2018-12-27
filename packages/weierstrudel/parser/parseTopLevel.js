/* eslint-disable no-bitwise */
const grammar = require('./grammar');
const inputMaps = require('./inputMap');
const regex = require('./regex');
const { opcodes } = require('./opcodes');

const TYPES = {
    OPCODE: 'OPCODE',
    PUSH: 'PUSH',
    JUMPDEST: 'JUMPDEST',
    PUSH_JUMP_LABEL: 'PUSH_JUMP_LABEL',
    MACRO: 'MACRO',
    TEMPLATE: 'TEMPLATE',
    CODESIZE: 'CODESIZE',
};

const CONTEXT = {
    NONE: 1,
    MACRO: 2,
};

function formatEvenBytes(bytes) {
    if ((Math.floor(bytes.length / 2) * 2) !== bytes.length) {
        return `0${bytes}`;
    }
    return bytes;
}

function toHex(integer) {
    return Number(integer).toString(16);
}

function check() {}

const parser = {};

parser.parseMacro = (body, macros) => {
    let input = body;
    let index = 0;
    const ops = [];
    const jumpdests = {};
    while (!regex.endOfData(input)) {
        if (input.match(grammar.macro.MACRO_CALL)) {
            const token = input.match(grammar.macro.MACRO_CALL);
            const macroName = token[1];
            const templateArgs = token[2] ? [token[2]] : [];
            check(macros[macroName], `expected ${macroName} to be a macro`);
            ops.push({
                type: TYPES.MACRO,
                value: macroName,
                args: templateArgs,
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.TEMPLATE)) {
            const token = input.match(grammar.macro.TEMPLATE);
            ops.push({
                type: TYPES.TEMPLATE,
                value: token[1],
                args: [],
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.CODE_SIZE)) {
            const token = input.match(grammar.macro.CODE_SIZE);
            const templateParams = token[2] ? [token[2]] : [];
            ops.push({
                type: TYPES.CODESIZE,
                value: token[1],
                args: templateParams,
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.JUMP_LABEL)) {
            const token = input.match(grammar.macro.JUMP_LABEL);
            check(!jumpdests[token[1]], `jump label ${token[1]} has already been defined`);
            ops.push({
                type: TYPES.JUMPDEST,
                value: token[1],
                args: [],
            });
            jumpdests[token[1]] = true;
            index += token[0].length;
        } else if (input.match(grammar.macro.LITERAL_DECIMAL)) {
            const token = input.match(grammar.macro.LITERAL_DECIMAL);
            const hex = formatEvenBytes(toHex(token[1]));
            ops.push({
                type: TYPES.PUSH,
                value: toHex(95 + (hex.length / 2)),
                args: [hex],
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.LITERAL_HEX)) {
            const token = input.match(grammar.macro.LITERAL_HEX);
            const hex = formatEvenBytes(token[1]);
            ops.push({
                type: TYPES.PUSH,
                value: toHex(95 + (hex.length / 2)),
                args: [hex],
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.TOKEN)) {
            const token = input.match(grammar.macro.TOKEN);
            if (opcodes[token[1]]) {
                ops.push({
                    type: TYPES.OPCODE,
                    value: opcodes[token[1]],
                    args: [],
                });
            } else {
                ops.push({
                    type: TYPES.PUSH_JUMP_LABEL,
                    value: token[1],
                    args: [],
                });
            }
            index += token[0].length;
        } else {
            throw new Error(`cannot parse ${input}!`);
        }
        input = body.slice(index);
    }
    return { ops, jumpdests };
};

parser.parseTopLevel = (raw, startingIndex, inputMap) => {
    let input = raw.slice(startingIndex);
    let currentContext = CONTEXT.NONE;

    const macros = [];
    let currentExpression = {};
    let index = startingIndex;
    while (!regex.endOfData(input)) {
        if ((currentContext === CONTEXT.NONE) && input.match(grammar.topLevel.TEMPLATE)) {
            const template = input.match(grammar.topLevel.TEMPLATE);
            const templateParams = regex.sliceCommas(template[1]);
            index += template[0].length;
            currentExpression = {
                ...currentExpression,
                templateParams,
            };
            currentContext = CONTEXT.MACRO;
        } else if ((currentContext & (CONTEXT.NONE | CONTEXT.MACRO)) && grammar.topLevel.MACRO.test(input)) {
            const macro = input.match(grammar.topLevel.MACRO);
            currentExpression = {
                ...currentExpression,
                name: macro[1],
                takes: macro[2],
                returns: macro[3],
                body: macro[4],
            };
            macros.push(parser.parseMacro(currentExpression, macros));
            index += macro[0].length;
            currentContext = CONTEXT.NONE;
            currentExpression = {};
        } else {
            const { filename, lineNumber, line } = inputMaps.getFileLine(index, inputMap);
            throw new Error(`could not process line ${lineNumber} in ${filename}: ${line}`);
        }
        input = raw.slice(index);
    }
    return macros;
};

module.exports = parser;
