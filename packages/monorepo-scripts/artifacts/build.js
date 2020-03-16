const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs-extra'));

const CONTRACTS_DIR = path.join(__dirname, '..', '..', 'protocol', 'build', 'contracts');
const ARTIFACTS_DIR = path.join(__dirname, '..', '..', 'contract-artifacts', 'artifacts');
const ARTIFACTS_DIR_AUX = path.join(__dirname, '..', '..', 'contract-artifacts', 'artifacts-aux');

const abiSwapContracts = ['Dividend', 'JoinSplit', 'JoinSplitFluid', 'PrivateRange', 'PublicRange', 'Swap'];
const excludedContracts = ['ERC20', 'IERC20', 'Migrations', 'Ownable', 'SafeMath'];

const cherrypickContractJson = async (filename) => {
    const filepath = path.join(CONTRACTS_DIR, filename);
    const content = JSON.parse(await fs.readFile(filepath, 'utf-8'));

    const filenameWithoutExtension = filename.replace('.json', '');
    if (abiSwapContracts.includes(filenameWithoutExtension)) {
        const contractInterfacePath = path.join(CONTRACTS_DIR, `${filenameWithoutExtension}Interface.json`);
        const contractInterface = JSON.parse(await fs.readFile(contractInterfacePath));
        content.abi = contractInterface.abi;
    }

    return {
        abi: content.abi,
        bytecode: content.bytecode,
        compiler: content.compiler,
        deployedBytecode: content.deployedBytecode || {},
        schemaVersion: content.schemaVersion,
    };
};

const isDuplicate = async (filename) => {
    const content = JSON.parse(await fs.readFile(path.join(CONTRACTS_DIR, filename), 'utf-8'));
    if (!fs.existsSync(path.join(ARTIFACTS_DIR, filename))) {
        return false;
    }
    const previousContent = JSON.parse(await fs.readFile(path.join(ARTIFACTS_DIR, filename), 'utf-8'));

    return (
        content.bytecode === previousContent.bytecode &&
        content.compiler.version === previousContent.compiler.version &&
        content.deployedBytecode === previousContent.deployedBytecode &&
        content.schemaVersion === previousContent.schemaVersion
    );
};

const buildArtifacts = async () => {
    try {
        if (!fs.existsSync(CONTRACTS_DIR)) {
            throw new Error('Please use truffle to compile your contracts first');
        }
        if (!fs.existsSync(ARTIFACTS_DIR)) {
            fs.mkdir(ARTIFACTS_DIR);
        }

        let filenames = await fs.readdir(CONTRACTS_DIR);
        filenames = filenames.filter((filename) => {
            const filenameWithoutExtension = filename.replace('.json', '');
            return !filenameWithoutExtension.endsWith('Test') && !excludedContracts.includes(filenameWithoutExtension);
        });

        for (let i = 0; i < filenames.length; i += 1) {
            const filename = filenames[i];
            /* eslint-disable no-await-in-loop */
            if (!(await isDuplicate(filename))) {
                const artifact = await cherrypickContractJson(filename);
                await fs.writeFile(path.join(ARTIFACTS_DIR, filename), JSON.stringify(artifact, null, 4));
            }
        }

        console.log('Successfully generated artifacts in the contract-artifacts package');
    } catch (err) {
        console.error('Failed with error:', err);
        process.exit(1);
    }
};

if (process.env.CI && process.env.CIRCLE_BRANCH === 'develop') {
    buildArtifacts();
} else {
    console.error('Script can only be run in a CI environment');
    process.exit(1);
}
