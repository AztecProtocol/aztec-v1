/* eslint-disable no-bitwise */
const BN = require('bn.js');
const path = require('path');
const fs = require('fs');

const grammar = require('./grammar/grammar');
const inputMaps = require('./inputMap/inputMap');
const regex = require('./utils/regex');
const {
    formatEvenBytes,
    toHex,
    padNBytes,
    normalize,
} = require('./utils');

const { opcodes } = require('./opcodes/opcodes');

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

function check(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


const parser = {};

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
    throw new Error(`I don't know how to process literal ${op}`);
};

parser.processTemplateLiteral = (literal, macros) => {
    if (literal.includes('-')) {
        return normalize(literal.split('-').map((op) => {
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
        return normalize(literal.split('+').map((op) => {
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
        return normalize(literal.split('*').map((op) => {
            if (regex.containsOperators(op)) {
                return parser.processTemplateLiteral(op, macros);
            }
            return parser.processMacroLiteral(op, macros);
        }).reduce((acc, val) => {
            if (!acc) { return val; }
            return acc.mul(val);
        }, null));
    }
    return parser.processMacroLiteral(literal, macros);
};

parser.parseTemplate = (templateName, macros = {}, index = 0) => {
    const macroId = parser.getId();
    // TODO: adopt parseExpression to support inline template compilation
    if (regex.isLiteral(templateName)) {
        const hex = formatEvenBytes(parser.processTemplateLiteral(templateName, macros).toString(16));
        const opcode = toHex(95 + (hex.length / 2));
        return {
            templateName: `inline-${templateName}-${macroId}`,
            macros: {
                ...macros,
                [`inline-${templateName}-${macroId}`]: {
                    name: `inline-${templateName}-${macroId}`,
                    ops: [{
                        type: TYPES.PUSH,
                        value: opcode,
                        args: [hex],
                        index,
                    }],
                    templateParams: [],
                },
            },
        };
    }
    if (opcodes[templateName]) {
        return {
            templateName: `inline-${templateName}-${macroId}`,
            macros: {
                ...macros,
                [`inline-${templateName}-${macroId}`]: {
                    name: templateName,
                    ops: [{
                        type: TYPES.OPCODE,
                        value: opcodes[templateName],
                        args: [],
                        index,
                    }],
                    templateParams: [],
                },
            },
        };
    }
    return {
        macros,
        templateName,
    };
};

parser.processMacro = (
    name,
    startingBytecodeIndex = 0,
    templateArgumentsRaw = [],
    startingMacros = {},
    map = {},
    measuring = false
) => {
    let macros = startingMacros;
    const macro = macros[name];

    check(macro, `expected ${macro} to exist!`);
    const {
        ops,
        templateParams,
    } = macro;
    const templateArguments = templateArgumentsRaw.reduce((a, t) => [...a, ...regex.sliceCommas(t)], []);

    check(templateParams.length === templateArguments.length, `macro ${name} has invalid templated inputs!`);
    const templateRegExps = templateParams.map((label, i) => {
        const pattern = new RegExp(`\\b(${label})\\b`, 'g');
        const value = templateArguments[i];
        return { pattern, value };
    });

    const jumptable = [];
    const jumpindices = {};
    let offset = startingBytecodeIndex;
    const codes = ops.map((op, index) => {
        switch (op.type) {
            case TYPES.MACRO: {
                const args = parser.substituteTemplateArguments(op.args, templateRegExps);
                const result = parser.processMacro(op.value, offset, args, macros, map);
                offset += (result.bytecode.length / 2);
                return result;
            }
            case TYPES.TEMPLATE: {
                const macroNameIndex = templateParams.indexOf(op.value);
                check(index !== -1, `cannot find template ${op.value}`);
                // what is this template? It's either a macro or a template argument;
                if (measuring) {
                    const codesize = '00'.repeat(templateArguments[macroNameIndex]);
                    return {
                        bytecode: codesize,
                        sourcemap: [],
                    };
                }
                let templateName = templateArguments[macroNameIndex];
                ({ macros, templateName } = parser.parseTemplate(templateName, macros, index));
                const result = parser.processMacro(templateName, offset, [], macros, map);
                offset += (result.bytecode.length / 2);
                return result;
            }
            case TYPES.CODESIZE: {
                check(index !== -1, `cannot find macro ${op.value}`);
                const result = parser.processMacro(op.value, offset, op.args, macros, map, true);
                const hex = formatEvenBytes((result.bytecode.length / 2).toString(16));
                const opcode = toHex(95 + (hex.length / 2));
                const bytecode = `${opcode}${hex}`;
                offset += (bytecode.length / 2);
                return {
                    bytecode: `${opcode}${hex}`,
                    sourcemap: [inputMaps.getFileLine(op.index, map)],
                };
            }
            case TYPES.OPCODE: {
                offset += 1;
                return {
                    bytecode: op.value,
                    sourcemap: [inputMaps.getFileLine(op.index, map)],
                };
            }
            case TYPES.PUSH: {
                check(op.args.length === 1, `wrong argument count for PUSH, ${JSON.stringify(op)}`);
                const codebytes = 1 + (op.args[0].length / 2);
                const sourcemap = [inputMaps.getFileLine(op.index, map)];
                offset += codebytes;
                return {
                    bytecode: `${op.value}${op.args[0]}`,
                    sourcemap: [...new Array(codebytes)].map(() => sourcemap),
                };
            }
            case TYPES.PUSH_JUMP_LABEL: {
                if (op.value === 'DOUBLE_AFFINE<X2,Y2,Z2>()') {
                    throw new Error('hey?');
                }
                jumptable[index] = op.value;
                const sourcemap = inputMaps.getFileLine(op.index, map);
                offset += 3;
                return {
                    bytecode: `${opcodes.push2}xxxx`,
                    sourcemap: [sourcemap, sourcemap, sourcemap],
                };
            }
            case TYPES.JUMPDEST: {
                jumpindices[op.value] = index;
                offset += 1;
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
    return ops;
};

parser.parseTopLevel = (raw, startingIndex, inputMap) => {
    let input = raw.slice(startingIndex);
    let currentContext = CONTEXT.NONE;

    let macros = {};
    let currentExpression = { templateParams: [] };
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
            const body = macro[4];
            macros = {
                ...macros,
                [macro[1]]: {
                    ...currentExpression,
                    name: macro[1],
                    takes: macro[2],
                    ops: parser.parseMacro(body, macros, index),
                    body: macro[4],
                },
            };
            index += macro[0].length;
            currentContext = CONTEXT.NONE;
            currentExpression = { templateParams: [] };
        } else {
            const { filename, lineNumber, line } = inputMaps.getFileLine(index, inputMap);
            throw new Error(`could not process line ${lineNumber} in ${filename}: ${line}`);
        }
        input = raw.slice(index);
    }
    return macros;
};

parser.removeComments = (string) => {
    let data = string;
    let formatted = '';
    while (!regex.endOfData(data)) {
        const multiIndex = data.indexOf('/*');
        const singleIndex = data.indexOf('//');
        if (multiIndex !== -1 && ((multiIndex < singleIndex) || singleIndex === -1)) {
            formatted += data.slice(0, multiIndex);
            const endBlock = data.indexOf('*/');
            check(endBlock !== -1, 'could not find closing comment block \\*');
            formatted += ' '.repeat(endBlock - multiIndex + 2);
            data = data.slice(endBlock + 2);
        } else if (singleIndex !== -1) {
            formatted += data.slice(0, singleIndex);
            data = data.slice(singleIndex);
            const endBlock = data.indexOf('\n');
            if (!endBlock) {
                formatted += ' '.repeat(data.length);
                data = '';
            } else {
                formatted += ' '.repeat(endBlock + 1);
                data = data.slice(endBlock + 1);
            }
        } else {
            formatted += data;
            break;
        }
    }
    return formatted;
};


parser.getFileContents = (originalFilename, partialPath) => {
    const included = {};
    const recurse = (filename) => {
        let fileString;
        if (filename.includes('#')) {
            fileString = filename; // hacky workaround for direct strings. TODO: find something more elegant
        } else {
            const filepath = path.posix.resolve(partialPath, filename);
            fileString = fs.readFileSync(filepath, 'utf8');
        }
        let formatted = parser.removeComments(fileString);
        let imported = [];
        let test = formatted.match(grammar.topLevel.IMPORT);
        while (test !== null) {
            const importStatement = formatted.match(grammar.topLevel.IMPORT);
            const empty = ' '.repeat(importStatement[0].length);
            formatted = empty + formatted.slice(importStatement[0].length);
            if (!included[importStatement[1]]) {
                imported = [...imported, ...recurse(importStatement[1])];
                included[importStatement[1]] = true;
            }
            test = formatted.match(grammar.topLevel.IMPORT);
        }

        const result = [...imported, {
            filename,
            data: formatted,
        }];
        return result;
    };
    const filedata = recurse(originalFilename);
    const raw = filedata.reduce((acc, { data }) => {
        return acc + data;
    }, '');
    return { filedata, raw };
};

parser.parseFile = (filename, partialPath) => {
    const { filedata, raw } = parser.getFileContents(filename, partialPath);
    const map = inputMaps.createInputMap(filedata);
    const macros = parser.parseTopLevel(raw, 0, map);
    return { inputMap: map, macros };
};

parser.compileMacro = (macroName, filename, partialPath) => {
    const { filedata, raw } = parser.getFileContents(filename, partialPath);
    const map = inputMaps.createInputMap(filedata);
    const macros = parser.parseTopLevel(raw, 0, map);
    const { bytecode, sourcemap } = parser.processMacro(macroName, 0, [], macros, map);
    return { bytecode, sourcemap };
};

module.exports = parser;
