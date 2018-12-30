/* eslint-disable no-bitwise */
const BN = require('bn.js');
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
    return new BN(integer, 10).toString(16);
}

function check(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function padNBytes(hex, numBytes) {
    check(hex.length <= (numBytes * 2), `value ${hex} has more than ${numBytes} bytes!`);
    let result = hex;
    while (result.length < (numBytes * 2)) {
        result = `0${result}`;
    }
    return result;
}

const parser = {};

parser.normalize = (number) => {
    const max = new BN(2).pow(new BN(256));
    if (number.lt(new BN(0))) {
        return number.umod(max);
    }
    if (number.gt(max.sub(new BN(1)))) {
        return number.umod(max);
    }
    return number;
};

parser.getId = () => {
    return [...new Array(10)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
};

parser.substituteTemplateArguments = (newTemplateArguments, templateRegExps) => {
    return newTemplateArguments.map(arg => templateRegExps
        .reduce((acc, { pattern, value }) => acc
            .replace(pattern, value), arg), []);
};

parser.processMacroLiteral = (op, macros) => {
    if (op.match(grammar.macro.LITERAL_HEX)) {
        return new BN(op.match(grammar.macro.LITERAL_HEX)[1], 16);
    }
    if (op.match(grammar.macro.LITERAL_DECIMAL)) {
        return new BN(op.match(grammar.macro.LITERAL_DECIMAL)[1], 10);
    }
    if (macros[op]) {
        check(
            macros[op].ops.length === 1 && macros[op].ops[0].type === TYPES.PUSH,
            `cannot add ${op}, ${macros[op].ops} not a literal`
        );
        return new BN(macros[op].ops[0].args[0], 16);
    }
    throw new Error(`cannot interpret parameter ${op} as literal`);
};

parser.processTemplateLiteral = (literal, macros) => {
    if (literal.includes('-')) {
        return parser.normalize(literal.split('-').map((op) => {
            if (regex.containsOperators(op)) {
                return parser.processTemplateLiteral(op, macros);
            }
            return parser.processMacroLiteral(op, macros);
        }).reduce((acc, val) => {
            if (!acc) { return val; }
            return acc.sub(val);
        }, null));
    }
    if (literal.includes('+')) {
        return parser.normalize(literal.split('+').map((op) => {
            if (regex.containsOperators(op)) {
                return parser.processTemplateLiteral(op, macros);
            }
            return parser.processMacroLiteral(op, macros);
        }).reduce((acc, val) => {
            if (!acc) { return val; }
            return acc.add(val);
        }, null));
    }
    if (literal.includes('*')) {
        return parser.normalize(literal.split('*').map((op) => {
            if (regex.containsOperators(op)) {
                return parser.processTemplateLiteral(op, macros);
            }
            return parser.processMacroLiteral(op, macros);
        }).reduce((acc, val) => {
            if (!acc) { return val; }
            return acc.mul(val);
        }, null));
    }
    throw new Error(`I don't know how to process literal ${literal}`);
};

parser.parseTemplate = (templateName, macros = {}, index = 0) => {
    const macroId = parser.getId();
    // TODO: adopt parseExpression to support inline template compilation
    if (regex.isLiteral(templateName)) {
        const hex = formatEvenBytes(parser.processTemplateLiteral(templateName, macros).toString(16));
        const opcode = toHex(95 + (hex.length / 2));
        return {
            ...macros,
            [`inline-${templateName}-${macroId}`]: {
                name: templateName,
                ops: [{
                    type: TYPES.PUSH,
                    value: opcode,
                    args: [hex],
                    index,
                }],
            },
        };
    }
    if (opcodes[templateName]) {
        return {
            ...macros,
            [`inline-${templateName}-${macroId}`]: {
                name: templateName,
                ops: [{
                    type: TYPES.OPCODE,
                    value: opcodes[templateName],
                    args: [],
                    index,
                }],
            },
        };
    }
    return null;// this.processMacro(templateName, bytecodeIndex, [], macros, map);
};

parser.processMacro = (name, startingBytecodeIndex = 0, templateArguments = [], startingMacros = {}, map = {}) => {
    let macros = startingMacros;
    const macro = macros[name];
    check(macro, `expected ${macro} to exist!`);
    const {
        ops,
        /* jumpdests, */
        templateParams,
    } = macro;
    check(templateParams.length === templateArguments.length, `macro ${name} has invalid templated inputs!`);
    const templateRegExps = templateParams.map((label, i) => {
        const pattern = new RegExp(`\\b(${label})\\b`, 'g');
        const value = templateArguments[i];
        return { pattern, value };
    });

    const jumptable = [];
    const jumpindices = {};
    const codes = ops.map((op, index) => {
        switch (op.type) {
            case TYPES.MACRO: {
                const args = parser.substituteTemplateArguments(op.args, templateRegExps);
                return parser.processMacro(op.value, args, macros, map);
            }
            case TYPES.TEMPLATE: {
                const macroNameIndex = templateArguments.indexOf(op.value);
                check(index !== -1, `cannot find template ${op.value}`);
                // what is this template? It's either a macro or a template argument;
                let templateName = templateArguments[macroNameIndex];
                ({ macros, templateName } = parser.parseTemplate(templateName, macros, index));
                return parser.processMacro(templateName, [], macros, map);
            }
            case TYPES.OPCODE: {
                return {
                    bytecode: op.value,
                    sourcemap: [inputMaps.getFileLine(op.index, map)],
                };
            }
            case TYPES.PUSH: {
                check(op.args.length === 1, `wrong argument count for PUSH, ${JSON.stringify(op)}`);
                const codebytes = 1 + (op.args[0].length / 2);
                const sourcemap = [inputMaps.getFileLine(op.index, map)];
                return {
                    bytecode: `${op.value}${op.args[0]}`,
                    sourcemap: [...new Array(codebytes)].map(() => sourcemap),
                };
            }
            case TYPES.PUSH_JUMP_LABEL: {
                jumptable[index] = op.value;
                const sourcemap = inputMaps.getFileLine(op.index, map);
                return {
                    bytecode: `${opcodes.push2}xxxx`,
                    sourcemap: [sourcemap, sourcemap, sourcemap],
                };
            }
            case TYPES.JUMPDEST: {
                console.log('index = ', index);
                jumpindices[op.value] = index;
                // jumpindices.push({ label: op.value, index });
                return {
                    bytecode: opcodes.jumpdest,
                    sourcemap: [inputMaps.getFileLine(op.index, map)],
                };
            }
            default: {
                check(false, `could not interpret op ${JSON.stringify(op)}`);
                return null;
            }
        }
    });
    let runningIndex = startingBytecodeIndex;
    const codeIndices = codes.map(({ bytecode }) => {
        const old = runningIndex;
        runningIndex += bytecode.length / 2;
        return old;
    });

    const data = codes.reduce((acc, { bytecode, sourcemap }, index) => {
        if (bytecode === `${opcodes.push2}xxxx`) {
            const jumplabel = jumptable[index];
            check(jumpindices[jumplabel] !== undefined, `expected jump label ${jumptable[index]} to exist`);
            const jumpindex = jumpindices[jumplabel];
            const jumpvalue = padNBytes(toHex(codeIndices[jumpindex]), 2);
            return {
                bytecode: acc.bytecode + `${opcodes.push2}${jumpvalue}`,
                sourcemap: [...acc.sourcemap, ...sourcemap],
            };
        }
        return {
            bytecode: acc.bytecode + bytecode,
            sourcemap: [...acc.sourcemap, ...sourcemap],
        };
    });
    const keys = Object.keys(jumpindices);
    keys.forEach((key) => {
        check(jumptable.find(i => i === key), `jump label ${key} is not used anywhere!`);
    });
    return data;
};

parser.parseMacro = (body, macros, startingIndex = 0) => {
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
                index: startingIndex + index + regex.countEmptyChars(token[0]),
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.TEMPLATE)) {
            const token = input.match(grammar.macro.TEMPLATE);
            ops.push({
                type: TYPES.TEMPLATE,
                value: token[1],
                args: [],
                index: startingIndex + index + regex.countEmptyChars(token[0]),
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.CODE_SIZE)) {
            const token = input.match(grammar.macro.CODE_SIZE);
            const templateParams = token[2] ? [token[2]] : [];
            ops.push({
                type: TYPES.CODESIZE,
                value: token[1],
                args: templateParams,
                index: startingIndex + index + regex.countEmptyChars(token[0]),
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.JUMP_LABEL)) {
            const token = input.match(grammar.macro.JUMP_LABEL);
            check(!jumpdests[token[1]], `jump label ${token[1]} has already been defined`);
            ops.push({
                type: TYPES.JUMPDEST,
                value: token[1],
                args: [],
                index: startingIndex + index + regex.countEmptyChars(token[0]),
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
                index: startingIndex + index + regex.countEmptyChars(token[0]),
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.LITERAL_HEX)) {
            const token = input.match(grammar.macro.LITERAL_HEX);
            const hex = formatEvenBytes(token[1]);
            ops.push({
                type: TYPES.PUSH,
                value: toHex(95 + (hex.length / 2)),
                args: [hex],
                index: startingIndex + index + regex.countEmptyChars(token[0]),
            });
            index += token[0].length;
        } else if (input.match(grammar.macro.TOKEN)) {
            const token = input.match(grammar.macro.TOKEN);
            if (opcodes[token[1]]) {
                ops.push({
                    type: TYPES.OPCODE,
                    value: opcodes[token[1]],
                    args: [],
                    index: startingIndex + index + regex.countEmptyChars(token[0]),
                });
            } else {
                ops.push({
                    type: TYPES.PUSH_JUMP_LABEL,
                    value: token[1],
                    args: [],
                    index: startingIndex + index + regex.countEmptyChars(token[0]),
                });
            }
            index += token[0].length;
        } else {
            throw new Error(`cannot parse ${input}!`);
        }
        input = body.slice(index);
    }
    return { ops, jumpdests, startingIndex };
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
            macros.push(parser.parseMacro(currentExpression, macros, index));
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
