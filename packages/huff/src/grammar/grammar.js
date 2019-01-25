const grammar = {};

function regex(params) {
    const val = new RegExp(params.join('\\s*\\n*'));
    return val;
}

grammar.topLevel = {
    TEMPLATE: regex([
        '^(?:[\\s\\n]*)template',
        '\\<(.*)\\>',
    ]),
    MACRO: regex([
        '^(?:[\\s\\n]*#[\\s\\n]*define)',
        '\\b(macro)\\b',
        '([A-Za-z0-9_]\\w*)',
        '=',
        'takes',
        '\\((\\d+)\\)',
        'returns',
        '\\((\\d+)\\)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    CODE_TABLE: regex([
        '^(?:[\\s\\n]*#[\\s\\n]*define)',
        '\\b(table)\\b',
        '([A-Za-z0-9_]\\w*)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    JUMP_TABLE: regex([
        '^(?:[\\s\\n]*#[\\s\\n]*define)',
        '\\b(jumptable)\\b',
        '([A-Za-z0-9_]\\w*)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    JUMP_TABLE_PACKED: regex([
        '^(?:[\\s\\n]*#[\\s\\n]*define)',
        '\\b(jumptable__packed)\\b',
        '([A-Za-z0-9_]\\w*)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    IMPORT: regex([
        '^(?:[\\s\\n]*)#',
        '(?:include)',
        '(?:\\"|\\\')',
        '(.*)',
        '(?:\\"|\\\')',
    ]),
};

grammar.jumpTable = {
    JUMPS: new RegExp('(?:[\\s\\n]*)[a-zA-Z_0-9\\-]+(?:$|\\s+)', 'g'),
};

// ^(?:\s*\n*)*__codesize\(([a-zA-Z0-9_\-]+)(?:<([a-zA-Z0-9_\-\+,\s\n]+)>)?\)
grammar.macro = {
    MACRO_CALL: regex([
        '^(?:[\\s\\n]*)([a-zA-Z0-9_]+)',
        '(?:<([a-zA-Z0-9_,\\+\\-\\*\\s\\n]+)>)?',
        '(?:\\(\\))',
    ]),
    TEMPLATE: regex([
        '^(?:[\\s\\n]*)<',
        '([a-zA-Z0-9_\\-\\+\\*]+)',
        '>\\s*\\n*',
    ]),
    CODE_SIZE: regex([
        '^(?:[\\s\\n]*)__codesize',
        '\\(',
        '([a-zA-Z0-9_\\-]+)',
        '(?:<([a-zA-Z0-9_,\\s\\n]+)>)?',
        '\\)\\s*\\n*',
    ]),
    TABLE_SIZE: regex([
        '^(?:[\\s\\n]*)__tablesize',
        '\\(',
        '([a-zA-Z0-9_\\-]+)',
        '(?:<([a-zA-Z0-9_,\\s\\n]+)>)?',
        '\\)\\s*\\n*',
    ]),
    TABLE_START: regex([
        '^(?:[\\s\\n]*)__tablestart',
        '\\(',
        '([a-zA-Z0-9_\\-]+)',
        '(?:<([a-zA-Z0-9_,\\s\\n]+)>)?',
        '\\)\\s*\\n*',
    ]),
    JUMP_LABEL: regex([
        '^(?:[\\s\\n]*)([a-zA-Z0-9_\\-]+):\\s*\\n*',
    ]),
    LITERAL_DECIMAL: regex([
        '^(?:[\\s\\n]*)(\\d+)\\b',
    ]),
    LITERAL_HEX: regex([
        '^(?:[\\s\\n]*)0x([0-9a-fA-F]+)\\b',
    ]),
    TOKEN: regex([
        '\\s*\\n*([^\\s]*)\\s*\\n*',
    ]),
};

module.exports = grammar;
