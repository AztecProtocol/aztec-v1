const Promise = require('bluebird');
const path = require('path');

const fs = Promise.promisifyAll(require('fs-extra'));

const CONTRACTS_DIR = './build/contracts/';
const ARTIFACTS_DIR = '../contract-artifacts/artifacts/';

const excludedContracts = [
    'JoinSplitABIEncoderTest.json',
    'Migrations.json',
    'SafeMath.json',
];

if (!fs.existsSync(CONTRACTS_DIR)) {
    console.error('Please use truffle to compile your contract first');
    process.exit(1);
}

const cherrypickContractJson = async (filename) => {
    const content = JSON.parse(await fs.readFile(path.join(CONTRACTS_DIR, filename), 'utf-8'));
    if (filename === 'AZTECERC20Bridge.json') {
        content.bytecode = content.bytecode.replace('AZTECInterface', 'AZTEC');
        content.deployedBytecode = content.deployedBytecode.replace('AZTECInterface', 'AZTEC');
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

const compileArtifacts = async () => {
    await fs.remove(ARTIFACTS_DIR);
    await fs.mkdir(ARTIFACTS_DIR);
    try {
        const filenames = await fs.readdir(CONTRACTS_DIR);
        filenames.forEach(async (filename) => {
            if (!excludedContracts.includes(filename)) {
                const artifact = await cherrypickContractJson(filename);
                await fs.writeFile(path.join(ARTIFACTS_DIR, filename), JSON.stringify(artifact, null, 4));
            }
        });
        console.log('Successfully generated artifacts in the contract-artifacts package');
    } catch (err) {
        console.error('Failed with error:', err);
    }
};

compileArtifacts();
