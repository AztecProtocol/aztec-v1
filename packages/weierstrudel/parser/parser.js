/* eslint-disable quote-props, no-restricted-syntax */
const fs = require('fs');
const BN = require('bn.js');
const path = require('path');

const partialPath = path.posix.resolve(__dirname, '../huff_modules');

const reverseOpcodes = {
    '00': 'STOP',
    '01': 'ADD',
    '02': 'MUL',
    '03': 'SUB',
    '04': 'DIV',
    '05': 'SDIV',
    '06': 'MOD',
    '07': 'SMOD',
    '08': 'ADDMOD',
    '09': 'MULMOD',
    '0a': 'EXP',
    '0b': 'SIGNEXTEND',
    '10': 'LT',
    '11': 'GT',
    '12': 'SLT',
    '13': 'SGT',
    '14': 'EQ',
    '15': 'ISZERO',
    '16': 'AND',
    '17': 'OR',
    '18': 'XOR',
    '19': 'NOT',
    '1a': 'BYTE',
    '20': 'SHA3',
    '30': 'ADDRESS',
    '31': 'BALANCE',
    '32': 'ORIGIN',
    '33': 'CALLER',
    '34': 'CALLVALUE',
    '35': 'CALLDATALOAD',
    '36': 'CALLDATASIZE',
    '37': 'CALLDATACOPY',
    '38': 'CODESIZE',
    '39': 'CODECOPY',
    '3a': 'GASPRICE',
    '3b': 'EXTCODESIZE',
    '3c': 'EXTCODECOPY',
    '3d': 'RETURNDATASIZE',
    '3e': 'RETURNDATACOPY',
    '40': 'BLOCKHASH',
    '41': 'COINBASE',
    '42': 'TIMESTAMP',
    '43': 'NUMBER',
    '44': 'DIFFICULTY',
    '45': 'GASLIMIT',
    '50': 'POP',
    '51': 'MLOAD',
    '52': 'MSTORE',
    '53': 'MSTORE8',
    '54': 'SLOAD',
    '55': 'SSTORE',
    '56': 'JUMP',
    '57': 'JUMPI',
    '58': 'GETPC',
    '59': 'MSIZE',
    '5a': 'GAS',
    '5b': 'JUMPDEST',
    '60': 'PUSH1',
    '61': 'PUSH2',
    '62': 'PUSH3',
    '63': 'PUSH4',
    '64': 'PUSH5',
    '65': 'PUSH6',
    '66': 'PUSH7',
    '67': 'PUSH8',
    '68': 'PUSH9',
    '69': 'PUSH10',
    '6a': 'PUSH11',
    '6b': 'PUSH12',
    '6c': 'PUSH13',
    '6d': 'PUSH14',
    '6e': 'PUSH15',
    '6f': 'PUSH16',
    '70': 'PUSH17',
    '71': 'PUSH18',
    '72': 'PUSH19',
    '73': 'PUSH20',
    '74': 'PUSH21',
    '75': 'PUSH22',
    '76': 'PUSH23',
    '77': 'PUSH24',
    '78': 'PUSH25',
    '79': 'PUSH26',
    '7a': 'PUSH27',
    '7b': 'PUSH28',
    '7c': 'PUSH29',
    '7d': 'PUSH30',
    '7e': 'PUSH31',
    '7f': 'PUSH32',
    '80': 'DUP1',
    '81': 'DUP2',
    '82': 'DUP3',
    '83': 'DUP4',
    '84': 'DUP5',
    '85': 'DUP6',
    '86': 'DUP7',
    '87': 'DUP8',
    '88': 'DUP9',
    '89': 'DUP10',
    '8a': 'DUP11',
    '8b': 'DUP12',
    '8c': 'DUP13',
    '8d': 'DUP14',
    '8e': 'DUP15',
    '8f': 'DUP16',
    '90': 'SWAP1',
    '91': 'SWAP2',
    '92': 'SWAP3',
    '93': 'SWAP4',
    '94': 'SWAP5',
    '95': 'SWAP6',
    '96': 'SWAP7',
    '97': 'SWAP8',
    '98': 'SWAP9',
    '99': 'SWAP10',
    '9a': 'SWAP11',
    '9b': 'SWAP12',
    '9c': 'SWAP13',
    '9d': 'SWAP14',
    '9e': 'SWAP15',
    '9f': 'SWAP16',
    'a0': 'LOG0',
    'a1': 'LOG1',
    'a2': 'LOG2',
    'a3': 'LOG3',
    'a4': 'LOG4',
    'f0': 'CREATE',
    'f1': 'CALL',
    'f2': 'CALLCODE',
    'f3': 'RETURN',
    'f4': 'DELEGATECALL',
    'fa': 'STATICCALL',
    'fb': 'CREATE2',
    'fd': 'REVERT',
    'fe': 'INVALID',
    'ff': 'SELFDESTRUCT',
};

const opcodes = {
    stop: '00',
    add: '01',
    mul: '02',
    sub: '03',
    div: '04',
    sdiv: '05',
    mod: '06',
    smod: '07',
    addmod: '08',
    mulmod: '09',
    exp: '0a',
    signextend: '0b',
    lt: '10',
    gt: '11',
    slt: '12',
    sgt: '13',
    eq: '14',
    iszero: '15',
    and: '16',
    or: '17',
    xor: '18',
    not: '19',
    byte: '1a',
    sha3: '20',
    keccak: '20',
    address: '30',
    balance: '31',
    origin: '32',
    caller: '33',
    callvalue: '34',
    calldataload: '35',
    calldatasize: '36',
    calldatacopy: '37',
    codesize: '38',
    codecopy: '39',
    gasprice: '3a',
    extcodesize: '3b',
    extcodecopy: '3c',
    returndatasize: '3d',
    returndatacopy: '3e',
    blockhash: '40',
    coinbase: '41',
    timestamp: '42',
    number: '43',
    difficulty: '44',
    gaslimit: '45',
    pop: '50',
    mload: '51',
    mstore: '52',
    mstore8: '53',
    sload: '54',
    sstore: '55',
    jump: '56',
    jumpi: '57',
    getpc: '58',
    msize: '59',
    gas: '5a',
    jumpdest: '5b',
    push1: '60',
    push2: '61',
    push3: '62',
    push4: '63',
    push5: '64',
    push6: '65',
    push7: '66',
    push8: '67',
    push9: '68',
    push10: '69',
    push11: '6a',
    push12: '6b',
    push13: '6c',
    push14: '6d',
    push15: '6e',
    push16: '6f',
    push17: '70',
    push18: '71',
    push19: '72',
    push20: '73',
    push21: '74',
    push22: '75',
    push23: '76',
    push24: '77',
    push25: '78',
    push26: '79',
    push27: '7a',
    push28: '7b',
    push29: '7c',
    push30: '7d',
    push31: '7e',
    push32: '7f',
    log0: 'a0',
    log1: 'a1',
    log2: 'a2',
    log3: 'a3',
    log4: 'a4',
    create: 'f0',
    call: 'f1',
    callcode: 'f2',
    return: 'f3',
    delegatecall: 'f4',
    staticcall: 'fa',
    create2: 'fb',
    revert: 'fd',
    invalid: 'fe',
    selfdestruct: 'ff',
    dup1: '80',
    dup2: '81',
    dup3: '82',
    dup4: '83',
    dup5: '84',
    dup6: '85',
    dup7: '86',
    dup8: '87',
    dup9: '88',
    dup10: '89',
    dup11: '8a',
    dup12: '8b',
    dup13: '8c',
    dup14: '8d',
    dup15: '8e',
    dup16: '8f',
    swap1: '90',
    swap2: '91',
    swap3: '92',
    swap4: '93',
    swap5: '94',
    swap6: '95',
    swap7: '96',
    swap8: '97',
    swap9: '98',
    swap10: '99',
    swap11: '9a',
    swap12: '9b',
    swap13: '9c',
    swap14: '9d',
    swap15: '9e',
    swap16: '9f',
};

const TYPES = {
    OPCODE: 'OPCODE',
    PUSH: 'PUSH',
    JUMPDEST: 'JUMPDEST',
    PUSH_JUMP_LABEL: 'PUSH_JUMP_LABEL',
    MACRO: 'MACRO',
    TEMPLATE: 'TEMPLATE',
};

function check(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function toHex(decimal) {
    // TODO: ugly! replace with something faster
    let hex = new BN(decimal, 10).toString(16);
    if ((Math.floor(hex.length / 2) * 2) !== hex.length) {
        hex = `0${hex}`;
    }
    return hex;
}

function padNBytes(hex, numBytes) {
    check(hex.length <= (numBytes * 2), `value ${hex} has more than ${numBytes} bytes!`);
    let result = hex;
    while (result.length < (numBytes * 2)) {
        result = `0${result}`;
    }
    return result;
}

function formatEvenBytes(bytes) {
    if ((Math.floor(bytes.length / 2) * 2) !== bytes.length) {
        return `0${bytes}`;
    }
    return bytes;
}

function newExpression(params) {
    return {
        name: '',
        takes: -1,
        returns: -1,
        bytecode: '',
        ops: [],
        jumpDests: {},
        ...params,
    };
}

function Parser() {
    this.file = '';
    this.tokens = [];
    this.tokenPtr = -1;
    this.contextState = '';
    this.currentExpression = newExpression();
    this.macros = {};
    this.includedFiles = {};
    this.inlineMacroId = 0;
}

Parser.prototype.parseTopLevel = function parseTopLevel(token) {
    if (token === '' || !token) { return this.parseTopLevel(this.next()); }
    if (token === 'template' && this.contextState === '') {
        this.contextState = 'define_template_params';
        this.currentExpression = newExpression();
        return this.parseTopLevel(this.next());
    }
    if (token.includes('<') && this.contextState === 'define_template_params') {
        check(token[token.length - 1] === '>', `expected ${token} to declare template params`);
        const params = token.slice(1, -1).split(',');
        this.currentExpression = {
            ...this.currentExpression,
            templateParams: params,
        };
        this.contextState = 'define_macro';
        return this.parseTopLevel(this.next());
    }
    if (token === '#define' && this.contextState === '') {
        this.contextState = 'new_expression';
        this.currentExpression = newExpression();
        return this.parseTopLevel(this.next());
    }
    if (token === '#define' && this.contextState === 'define_macro') {
        this.contextState = 'new_expression';
        return this.parseTopLevel(this.next());
    }
    if (this.contextState === 'new_expression') {
        check(!this.macros[token], `macro ${token} has already been defined`);
        this.currentExpression = {
            ...this.currentExpression,
            name: token,
        };
        this.contextState = 'expression_equals';
        return this.parseTopLevel(this.next());
    }
    if (token === '=' && this.contextState === 'expression_equals') {
        this.contextState = 'expression_takes';
        return this.parseTopLevel(this.next());
    }
    if (token.includes('takes(') && this.contextState === 'expression_takes') {
        const takes = token.slice(6, -1);
        check(token === `takes(${takes})` && takes.match(/^-{0,1}\d+$/), `error, malformed token ${token}`);
        this.currentExpression = { ...this.currentExpression, takes: Number(takes) };
        this.contextState = 'expression_returns';
        return this.parseTopLevel(this.next());
    }
    if (token.includes('returns(') && this.contextState === 'expression_returns') {
        const returns = token.slice(8, -1);
        check(token === `returns(${returns})` && returns.match(/^-{0,1}\d+$/), `error, malformed token ${token}`);
        this.currentExpression = { ...this.currentExpression, returns: Number(returns) };
        this.contextState = 'expression_start';
        return this.parseTopLevel(this.next());
    }
    if (token === '{' && this.contextState === 'expression_start') {
        this.contextState = '';
        return this.parseExpression();
    }
    if (token === 'end') {
        return this.macros;
    }
    throw new Error(`error, cannot parse top-level token ${token}`);
};

Parser.prototype.parseExpression = function parseExpression() {
    let foundTerminator = false;
    while (!foundTerminator) {
        const token = this.next();
        const opcode = opcodes[token];
        if (opcode) {
            this.currentExpression.ops.push({
                type: TYPES.OPCODE,
                value: opcode,
                args: [],
            });
        } else if (token.slice(-1) === ':') {
            const jumpDest = token.slice(0, -1);
            check(!this.currentExpression.jumpDests[jumpDest], `jump label ${jumpDest} has already been defined`);
            this.currentExpression.ops.push({
                type: TYPES.JUMPDEST,
                value: jumpDest,
                args: [],
            });
            this.currentExpression.jumpDests[jumpDest] = true;
        } else if (token.slice(-3) === '>()') {
            const separated = token.split('<');
            const macroName = separated[0];
            const templateArgs = separated[1].slice(0, -3).split(',');
            const macro = this.macros[macroName];
            check(macro, `expected ${macroName} to be a macro`);
            this.currentExpression.ops.push({
                type: TYPES.MACRO,
                value: macroName,
                args: templateArgs,
            });
        } else if (token.slice(0, 1) === '<') {
            check(token.slice(-1) === '>', `expected ${token} to be a template param`);
            this.currentExpression.ops.push({
                type: TYPES.TEMPLATE,
                value: token.slice(1, -1),
                args: [],
            });
        } else if (token.slice(token.length - 2) === '()') {
            const macroToken = token.slice(0, token.length - 2);
            const [name] = macroToken.split('<');
            const macro = this.macros[name];
            check(macro, `expected ${name} from ${token} to be a macro`);
            this.currentExpression.ops.push({
                type: TYPES.MACRO,
                value: name,
                args: [],
            });
        } else if (token.includes('0x')) {
            const hex = formatEvenBytes(token.slice(2));
            this.currentExpression.ops.push({
                type: TYPES.PUSH,
                value: toHex(95 + (hex.length / 2)),
                args: [hex],
            });
        } else if (token.match(/^-{0,1}\d+$/)) {
            const hex = formatEvenBytes(new BN(token, 10).toString(16)); // todo, something better than this!
            this.currentExpression.ops.push({
                type: TYPES.PUSH,
                value: toHex(95 + (hex.length / 2)),
                args: [hex],
            });
        } else if (token === '}') {
            this.macros = {
                ...this.macros,
                [this.currentExpression.name]: this.currentExpression,
            };
            this.contextState = '';
            foundTerminator = true;
            break;
        } else if (token !== '') {
            this.currentExpression.ops.push({
                type: TYPES.PUSH_JUMP_LABEL,
                value: token,
            });
        }
    }
    return this.parseTopLevel(this.next());
};

Parser.prototype.processMacro = function processMacro(name, bytecodeIndex = 0, templateParams = {}) {
    const identifier = `${name}.${bytecodeIndex}`;
    const context = { bytecode: '', transcript: [`#${identifier}`] };
    const macro = this.macros[name];
    check(macro, `expected ${macro} to exist!`);
    const { ops } = macro;
    let offset = bytecodeIndex;
    const jumpTable = {};
    const jumpIndices = [];
    const templateLabels = this.macros[name].templateParams;
    for (const op of ops) {
        switch (op.type) {
            case TYPES.MACRO: {
                const newContext = this.processMacro(op.value, offset, op.args);
                context.bytecode += newContext.bytecode;
                context.transcript = [...context.transcript, newContext.transcript];
                offset += (newContext.bytecode.length / 2);
                break;
            }
            case TYPES.OPCODE: {
                context.bytecode += op.value;
                context.transcript = [...context.transcript, reverseOpcodes[op.value]];
                offset += 1;
                break;
            }
            case TYPES.PUSH: {
                check(op.args.length === 1, `wrong argument count for PUSH. op = ${JSON.stringify(op)}`);
                context.bytecode += `${op.value}${op.args[0]}`;
                context.transcript = [...context.transcript, `PUSH ${op.args[0]}`];
                offset += (1 + (op.args[0].length / 2));
                break;
            }
            case TYPES.TEMPLATE: {
                const index = templateLabels.indexOf(op.value);
                check(index !== -1, `cannot find template label ${op.value}`);
                let macroName = templateParams[index];
                let templateMacro;
                // TODO: adopt parseExpression to support inline template compilation
                if (opcodes[macroName]) {
                    templateMacro = newExpression({
                        name: macroName,
                        ops: [{
                            type: TYPES.OPCODE,
                            value: opcodes[macroName],
                            args: [],
                        }],
                    });
                    macroName = `inline-${macroName}-${this.inlineMacroId}`;
                    this.macros[macroName] = templateMacro;
                    this.inlineMacroId += 1;
                } else if (macroName.includes('0x')) {
                    const hex = formatEvenBytes(macroName.slice(2));
                    const opcode = toHex(95 + (hex.length / 2));
                    templateMacro = newExpression({
                        name: macroName,
                        ops: [{
                            type: TYPES.PUSH,
                            value: opcode,
                            args: [hex],
                        }],
                    });
                    macroName = `inline-${macroName}-${this.inlineMacroId}`;
                    this.macros[macroName] = templateMacro;
                    this.inlineMacroId += 1;
                } else {
                    templateMacro = this.macros[macroName];
                    check(templateMacro, `cannot find template ${macroName}`);
                }
                // TODO: support recursive templating
                const newContext = this.processMacro(macroName, offset, []);
                context.bytecode += newContext.bytecode;
                context.transcript = [...context.transcript, newContext.transcript];
                offset += (newContext.bytecode.length / 2);
                break;
            }
            case TYPES.PUSH_JUMP_LABEL: {
                const jumpEntry = jumpTable[op.value] || [];
                jumpEntry.push(Number(offset) + 1 - Number(bytecodeIndex));
                context.bytecode += `${opcodes.push2}xxxx`;
                context.transcript = [...context.transcript, `${identifier}.${op.value}`];
                offset += 3;
                jumpTable[op.value] = jumpEntry;
                break;
            }
            case TYPES.JUMPDEST: {
                jumpIndices.push({ label: op.value, offset });
                context.bytecode += opcodes.jumpdest;
                context.transcript = [...context.transcript, `${identifier}.${op.value}:`];
                offset += 1;
                break;
            }
            default: {
                check(false, `could not interpret op ${JSON.stringify(op)}`);
            }
        }
    }

    // add in jump indices
    for (const { label: jumpLabel, offset: offsetBase } of jumpIndices) {
        const jumpInvocations = jumpTable[jumpLabel];
        const jumpOffset = padNBytes(toHex(offsetBase), 2);
        check(jumpInvocations, `jump label ${jumpLabel} is not used any where in ${name}!`);
        for (const byteOffset of jumpInvocations) {
            const pushOffset = byteOffset * 2;
            check(
                context.bytecode.slice(pushOffset, pushOffset + 4) === 'xxxx',
                `jump to ${jumpLabel} at index ${pushOffset * 2} badly formed.`
            );
            const first = context.bytecode.slice(0, pushOffset);
            const second = context.bytecode.slice(pushOffset + 4);
            context.bytecode = `${first}${jumpOffset}${second}`;
        }
    }
    check(
        context.bytecode.indexOf('x') === -1,
        `error, did not replace all jump invokations in ${JSON.stringify(macro)}. ${context.bytecode}`
    );
    return context;
};

function removeComments(lines) {
    const output = [];
    let i = 0;
    while (i < lines.length) {
        const multiIndex = lines[i].indexOf('/*');
        const singleIndex = lines[i].indexOf('//');
        if (multiIndex !== -1) {
            output.push(lines[i].slice(0, multiIndex));
            while (i < lines.length) {
                const endBlock = lines[i].indexOf('*/');
                if (endBlock !== -1) {
                    output.push(lines[i].slice(endBlock + 2));
                    break;
                }
                i += 1;
            }
        } else if (singleIndex !== -1) {
            output.push(lines[i].slice(0, singleIndex));
        } else {
            output.push(lines[i]);
        }
        i += 1;
    }
    return output;
}

Parser.prototype.getFileContents = function getFileContents(filename) {
    let fileString;
    if (filename.includes('#')) {
        fileString = filename; // hacky workaround for direct strings. TODO: find something more elegant
    } else {
        const filepath = path.posix.resolve(partialPath, filename);
        fileString = fs.readFileSync(filepath, 'utf8');
    }
    const lines = removeComments(fileString.split('\n'));
    let i = 0;
    let imported = [];
    while (i < lines.length) {
        if (lines[i].includes('#include')) {
            const sliced = lines[i].split('"');
            check(sliced.length === 3, `cannot parse include statement ${lines}`);
            if (!this.includedFiles[sliced[1]]) {
                imported = [...imported, ...this.getFileContents(sliced[1])];
            }
        } else if (!(lines[i] === '' || lines[i] === null || !lines[i])) {
            break;
        }
        i += 1;
    }
    this.includedFiles[filename] = true;
    return [...imported, ...lines.slice(i)];
};

Parser.prototype.parseFile = function parseFile(filename) {
    const lines = this.getFileContents(filename);
    this.tokens = lines.reduce((acc, current) => {
        return [...acc, ...current.split(' ')];
    }, []);
    this.parseTopLevel(this.next());
    return this.macros;
};

Parser.prototype.next = function next() {
    this.tokenPtr += 1;
    if (Number(this.tokenPtr) === Number(this.tokens.length)) {
        return 'end';
    }
    return this.tokens[this.tokenPtr];
};

Parser.prototype.getInitState = function getInitState(...params) {
    let bytecode = '';
    for (let i = 0; i < params.length; i += 1) {
        let hex = new BN(params[i], 10).toString(16); // todo, something better than this!
        if ((Math.floor(hex.length / 2) * 2) !== hex.length) {
            hex = `0${hex}`;
        }
        const opcode = 95 + (hex.length / 2);
        bytecode += `${new BN(opcode, 10).toString(16)}${hex}`;
    }
    return bytecode;
};

module.exports = Parser;
