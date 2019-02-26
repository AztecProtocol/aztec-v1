const Promise = require('bluebird');
const path = require('path');

const fs = Promise.promisifyAll(require('fs-extra'));

const CONTRACTS_DIR = './build/contracts/';
const ARTIFACTS_DIR = '../contract-artifacts/artifacts/';
const ARTIFACTS_DIR_AUX = '../contract-artifacts/artifacts-aux/';

const excludedContracts = [
    'JoinSplitABIEncoderTest.json',
    'Migrations.json',
    'SafeMath.json',
];

if (!fs.existsSync(CONTRACTS_DIR)) {
    console.error('Please use truffle to compile your contract first');
    process.exit(1);
}

if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdir(ARTIFACTS_DIR);
}

const cherrypickContractJson = async (filename) => {
    const content = JSON.parse(await fs.readFile(path.join(CONTRACTS_DIR, filename), 'utf-8'));
    if (filename === 'JoinSplit') {
        const joinSplitInterface = JSON.parse(await fs.readFile(path.join(CONTRACTS_DIR, 'JoinSplitInterface.sol')));
        content.abi = joinSplitInterface.abi;
    }
    return {
        abi: content.abi,
        bytecode: content.bytecode,
        compiler: content.compiler,
        deployedBytecode: content.deployedBytecode || {},
        schemaVersion: content.schemaVersion,
        updatedAt: content.updatedAt,
    };
};

const isDuplicate = async (filename) => {
    const content = JSON.parse(await fs.readFile(path.join(CONTRACTS_DIR, filename), 'utf-8'));
    if (!fs.existsSync(path.join(ARTIFACTS_DIR, filename))) {
        return false;
    }
    const previousContent = JSON.parse(await fs.readFile(path.join(ARTIFACTS_DIR, filename), 'utf-8'));
    return content.abi === previousContent.abi
        && content.bytecode === previousContent.bytecode
        && content.compiler === previousContent.compiler
        && content.deployedBytecode === previousContent.deployedBytecode
        && content.schemaVersion === previousContent.schemaVersion
        && content.updatedAt === previousContent.updatedAt;
};

const compileArtifacts = async () => {
    await fs.remove(ARTIFACTS_DIR_AUX);
    await fs.mkdir(ARTIFACTS_DIR_AUX);
    try {
        const filenames = await fs.readdir(CONTRACTS_DIR);
        for (let i = 0; i < filenames.length; i += 1) {
            const filename = filenames[i];
            /* eslint-disable no-await-in-loop */
            if (!excludedContracts.includes(filename) && !(await isDuplicate(filename))) {
                const artifact = await cherrypickContractJson(filename);
                await fs.writeFile(path.join(ARTIFACTS_DIR_AUX, filename), JSON.stringify(artifact, null, 4));
            }
        }
        await fs.remove(ARTIFACTS_DIR);
        await fs.rename(ARTIFACTS_DIR_AUX, ARTIFACTS_DIR);
        await fs.remove(ARTIFACTS_DIR_AUX);
        console.log('Successfully generated artifacts in the contract-artifacts package');
    } catch (err) {
        console.error('Failed with error:', err);
    }
};

compileArtifacts();
