/* eslint-disable no-restricted-syntax */
const fs = require('fs');

const newParser = require('../parser');
const { padNBytes, toHex } = require('../utils');

function compiler(projectConfig, modulesPath) {
    let settings;
    if (typeof (projectConfig) === 'string' && fs.existsSync(projectConfig)) {
        settings = JSON.parse(fs.readFileSync(projectConfig, 'utf8'));
    } else if (typeof (projectConfig) === 'object') {
        settings = { ...projectConfig };
    } else {
        throw new Error(`could not find project ${projectConfig}`);
    }

    const {
        abi,
        name,
        file: entryFilename,
        entryMacro,
        constructor,
    } = settings;

    if (!entryMacro || !constructor || !entryFilename) {
        throw new Error(`could not find ${entryMacro}, ${constructor}, ${entryFilename}`);
    }

    const { inputMap, macros, jumptables } = newParser.parseFile(entryFilename, modulesPath);

    const { data: macroData } = newParser.processMacro(entryMacro, 0, [], macros, inputMap, jumptables);
    const { data: constructorData } = newParser.processMacro(constructor, 0, [], macros, inputMap, {});

    const contractLength = macroData.bytecode.length / 2;
    const constructorLength = constructorData.bytecode.length / 2;

    const contractSize = padNBytes(toHex(contractLength), 2);
    const contractCodeOffset = padNBytes(toHex(13 + constructorLength), 2);

    // push2(contract size) dup1 push2(offset to code) push1(0) codecopy push1(0) return
    const bootstrapCode = `61${contractSize}8061${contractCodeOffset}6000396000f3`;
    const constructorCode = `${constructorData.bytecode}${bootstrapCode}`;
    const deployedBytecode = `0x${macroData.bytecode}`;
    const bytecode = `0x${constructorCode}${macroData.bytecode}`;

    const filedata = {
        abi,
        contractName: name,
        bytecode,
        deployedBytecode,
        compiler: {
            name: 'huff',
            version: '0.2.0', // TODO: versioning
        },
    };
    return {
        filename: `${name}.json`,
        filedata,
    };
}

module.exports = compiler;
