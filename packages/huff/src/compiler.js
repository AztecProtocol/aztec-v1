/* eslint-disable no-restricted-syntax */
const path = require('path');
const fs = require('fs');

const newParser = require('./parser');
const { padNBytes, toHex } = require('./utils');

function Compiler(projectName, projectPath) {
    let settingsString;
    try {
        const fileLocation = path.posix.resolve(projectPath, projectName);
        settingsString = fs.readFileSync(fileLocation, 'utf8');
    } catch (e) {
        console.log(e);
        settingsString = projectName;
    }

    const settings = JSON.parse(settingsString);
    const { abi, name, file: entryFilename, entryMacro, constructor } = settings;
    if (!entryMacro || !constructor || !entryFilename) {
        throw new Error(`could not find ${entryMacro}, ${constructor}, ${entryFilename}`);
    }
    const { inputMap, macros, jumptables } = newParser.parseFile(entryFilename, projectPath);

    const { data: macroData } = newParser.processMacro(entryMacro, 0, [], macros, inputMap, jumptables);
    const { data: constructorData } = newParser.processMacro(constructor, 0, [], macros, inputMap, {});

    const contractLength = macroData.bytecode.length / 2;
    const constructorLength = constructorData.bytecode.length / 2;

    const contractSize = padNBytes(toHex(contractLength), 2);
    const contractCodeOffset = padNBytes(toHex(13 + constructorLength), 2);

    // push2(contract size) dup1 push2(offset to code) push1(0) codecopy push1(0) return
    const bootstrapCode = `61${contractSize}8061${contractCodeOffset}6000396000f3`;
    const constructorCode = `${constructorData.bytecode}${bootstrapCode}`;

    const { bytecode } = macroData;
    const deployedBytecode = `${constructorCode}${bytecode}`;

    const output = {
        abi,
        name,
        bytecode,
        deployedBytecode,
    };
    fs.writeFileSync(path.posix.resolve(projectPath, 'build.json'), JSON.stringify(output));
}

module.exports = Compiler;
