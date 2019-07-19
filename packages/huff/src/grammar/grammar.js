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
        '(\\w+)',
        '=',
        'takes',
        '\\((\\d+)\\)',
        'returns',
        '\\((\\d+)\\)',
        '\\{)((?:[^\\}])*)\\}',
    ]),
    CODE_TABLE: regex([
        '(^(?:#[\\s\\n]*define)',
        '\\b(table)\\b[\\s\\n]*)(\\w+)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    JUMP_TABLE: regex([
        '^(?:#[\\s\\n]*define)',
        '\\b(jumptable)\\b',
        '(\\w+)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    JUMP_TABLE_PACKED: regex([
        '^(?:#[\\s\\n]*define)',
        '\\b(jumptable__packed)\\b',
        '(\\w+)',
        '\\{((?:[^\\}])*)\\}',
    ]),
    IMPORT: regex([
        '^#',
        '(?:include)',
        '(\\"|\\\')',
        '(.+?)',
        '\\1',
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
        '^(\\w+)(?:<([\\w,\\+\\-\\*\\(\\)\\s\\n<>]+?)>)?',
        '(?:\\(\\))',
    ]),
    TEMPLATE: regex([
        '^<',
        '([\\w\\-\\+\\*\\(\\)\\<\\>]+)',
        '>',
    ]),
    CODE_SIZE: regex([
        '^__codesize',
        '\\(',
        '([\\w\\-]+)',
        '(?:<([\\w,\\s\\n]+)>)?',
        '\\)',
    ]),
    TABLE_SIZE: regex([
        '^__tablesize',
        '\\(',
        '([\\w_\\-]+)',
        '(?:<([\\w,\\s\\n]+)>)?',
        '\\)',
    ]),
    TABLE_START: regex([
        '^__tablestart',
        '\\(',
        '([\\w_\\-]+)',
        '(?:<([\\w,\\s\\n]+)>)?',
        '\\)',
    ]),
    JUMP_LABEL: regex([
        '^([\\w\\-]+):',
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
