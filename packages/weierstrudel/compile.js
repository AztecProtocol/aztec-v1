const path = require('path');
const fs = require('fs');

const parser = require('./huff/src/parser');

const pathToData = path.posix.resolve(__dirname, './huff_modules');

const { inputMap, macros, jumptables } = parser.parseFile('main_loop.huff', pathToData);

const {
    data: { bytecode: macroCode },
} = parser.processMacro('MAIN__WEIERSTRUDEL', 0, [], macros, inputMap, jumptables);

const {
    data: { bytecode: compilerCode },
} = parser.processMacro('MAIN__CONSTRUCTOR', 0, [], macros, inputMap, jumptables);

const bytecode = compilerCode + macroCode;

const contract = {
    name: 'WEIERSTRUDEL',
    bytecode: `0x${macroCode}`,
    deployedBytecode: `0x${bytecode}`,
};

fs.writeFileSync(
    path.posix.resolve(__dirname, './weierstrudel.json'),
    JSON.stringify(contract)
);

console.log('written bytecode to weierstrudel.json');
