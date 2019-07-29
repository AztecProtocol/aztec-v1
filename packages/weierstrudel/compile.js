const path = require('path');
const fs = require('fs');

const { compiler } = require('../huff/src');
const parser = require('../huff/src/parser');

const pathToData = path.posix.resolve(__dirname, './huff_modules');

const { inputMap, macros, jumptables } = parser.parseFile('main_loop.huff', pathToData);

const {
    data: { bytecode: macroCode },
} = parser.processMacro('WEIERSTRUDEL__MAIN', 0, [], macros, inputMap, jumptables);

const {
    data: { bytecode: compilerCode },
} = parser.processMacro('WEIERSTRUDEL__CONSTRUCTOR', 0, [], macros, inputMap, jumptables);

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

compiler('huff_projects/weierstrudel_project.json', pathToData);

console.log('written bytecode to weierstrudel.json');
