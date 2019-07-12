const grammar = {};

function regex(params) {
    const val = new RegExp(params.join('[\\s\\n]*'));
    return val;
}

grammar.topLevel = {
    TEMPLATE: regex([
        '^template',
        '\\<(.*)\\>',
    ]),
    MACRO: regex([
        '(^(?:#[\\s\\n]*define)',
        '\\b(macro)\\b',
        '([A-Za-z0-9_]\\w*)',
        '=',
        'takes',
        '\\((\\d+)\\)',
        'returns',
        '\\((\\d+)\\)',
        '\\{)((?:[^\\}])*)\\}',
    ]),
    CODE_TABLE: regex([
        '^(?:#[\\s\\n]*define)',
        '\\b(table)\\b',
        '([A-Za-z0-9_]\\w*)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    JUMP_TABLE: regex([
        '^(?:#[\\s\\n]*define)',
        '\\b(jumptable)\\b',
        '([A-Za-z0-9_]\\w*)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    JUMP_TABLE_PACKED: regex([
        '^(?:#[\\s\\n]*define)',
        '\\b(jumptable__packed)\\b',
        '([A-Za-z0-9_]\\w*)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    // TODO: fix this
    IMPORT: regex([
        '^#',
        // '^(?:[\\s\\n]*)#',
        '(?:include)',
        '(?:\\"|\\\')',
        '(.*)',
        '(?:\\"|\\\')',
    ]),
    WHITESPACE: regex([
        '^([\\s\\n\\r]+)',
    ]),
};

grammar.jumpTable = {
    JUMPS: new RegExp('(?:[\\s\\n]*)[a-zA-Z_0-9\\-]+(?:$|\\s+)', 'g'),
};

// ^(?:\s*\n*)*__codesize\(([a-zA-Z0-9_\-]+)(?:<([a-zA-Z0-9_\-\+,\s\n]+)>)?\)
grammar.macro = {
    MACRO_CALL: regex([
        // '^(?:[\\s\\n]*)([a-zA-Z0-9_]+)(?:<([a-zA-Z0-9_,\\+\\-\\*\\(\\)\\s\\n<>]+)>)?',
        '^([a-zA-Z0-9_]+)(?:<([a-zA-Z0-9_,\\+\\-\\*\\(\\)\\s\\n]+)>)?',
        '(?:\\(\\))',
    ]),
    TEMPLATE: regex([
        '^<',
        '([a-zA-Z0-9_\\-\\+\\*\\(\\)\\<\\>]+)',
        '>',
    ]),
    CODE_SIZE: regex([
        '^__codesize',
        '\\(',
        '([a-zA-Z0-9_\\-]+)',
        '(?:<([a-zA-Z0-9_,\\s\\n]+)>)?',
        '\\)',
    ]),
    TABLE_SIZE: regex([
        '^__tablesize',
        '\\(',
        '([a-zA-Z0-9_\\-]+)',
        '(?:<([a-zA-Z0-9_,\\s\\n]+)>)?',
        '\\)',
    ]),
    TABLE_START: regex([
        '^__tablestart',
        '\\(',
        '([a-zA-Z0-9_\\-]+)',
        '(?:<([a-zA-Z0-9_,\\s\\n]+)>)?',
        '\\)',
    ]),
    JUMP_LABEL: regex([
        '^([a-zA-Z0-9_\\-]+):',
    ]),
    LITERAL_DECIMAL: regex([
        '^(\\d+)\\b',
    ]),
    LITERAL_HEX: regex([
        '^0x([0-9a-fA-F]+)\\b',
    ]),
    TOKEN: regex([
        '([^\\s\\n\\r]+)',
    ]),
    WHITESPACE: regex([
        '^([\\s\\n\\r]+)',
    ]),
};

module.exports = grammar;
