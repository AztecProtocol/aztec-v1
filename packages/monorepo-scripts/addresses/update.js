const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));

const { NetworkId } = require('../../contract-addresses/src');

const PACKAGES_PATH = path.join(__dirname, '..', '..');
const CONTRACT_ADDRESSES_PATH = path.join(PACKAGES_PATH, 'contract-addresses');
const CONTRACTS_DIR = path.join(PACKAGES_PATH, 'protocol', 'build', 'contracts');
const RINKEBY_ADDRESSES_FILE = path.join(CONTRACT_ADDRESSES_PATH, 'addresses', 'rinkeby.json');
const ROPSTEN_ADDRESSES_FILE = path.join(CONTRACT_ADDRESSES_PATH, 'addresses', 'ropsten.json');
const MAINNET_ADDRESSES_FILE = path.join(CONTRACT_ADDRESSES_PATH, 'addresses', 'mainnet.json');

const deployedContracts = [
    'ACE',
    'AccountRegistryManager',
    'Behaviour20200106',
    'Dividend',
    'ERC20Mintable',
    'FactoryAdjustable201907',
    'FactoryBase201907',
    'JoinSplit',
    'JoinSplitFluid',
    'PrivateRange',
    'PublicRange',
    'Swap',
    'ZkAsset',
    'ZkAssetAdjustable',
];

const rinkebyAddresses = {};
const ropstenAddresses = {};
const mainnetAddresses = {};

const extractNetworkAddress = async (filename) => {
    const filenameWithoutExtension = filename.replace('.json', '');
    const filepath = path.join(CONTRACTS_DIR, filename);
    const content = JSON.parse(await fs.readFile(filepath, 'utf-8'));
    if (!content.networks) {
        throw new Error(`Networks object not found in ${filenameWithoutExtension} artifact`);
    }

    // Rinkeby
    if (!content.networks[NetworkId.Rinkeby]) {
        throw new Error(`Rinkeby address not found for ${filenameWithoutExtension}`);
    }
    rinkebyAddresses[filenameWithoutExtension] = content.networks[NetworkId.Rinkeby].address;

    // Ropsten
    if (!content.networks[NetworkId.Ropsten]) {
        throw new Error(`Ropsten address not found for ${filenameWithoutExtension}`);
    }
    ropstenAddresses[filenameWithoutExtension] = content.networks[NetworkId.Ropsten].address;

    // Mainnet
    if (!content.networks[NetworkId.Mainnet]) {
        throw new Error(`Mainnet address not found for ${filenameWithoutExtension}`);
    }
    mainnetAddresses[filenameWithoutExtension] = content.networks[NetworkId.Mainnet].address;
};

const updateTestnetJsons = async () => {
    await fs.writeFile(RINKEBY_ADDRESSES_FILE, JSON.stringify(rinkebyAddresses, null, 4));
    await fs.writeFile(ROPSTEN_ADDRESSES_FILE, JSON.stringify(ropstenAddresses, null, 4));
    await fs.writeFile(MAINNET_ADDRESSES_FILE, JSON.stringify(mainnetAddresses, null, 4));
};

const updateAddresses = async () => {
    try {
        if (!fs.existsSync(CONTRACTS_DIR)) {
            throw new Error('Please use truffle to compile your contracts first');
        }
        let filenames = await fs.readdir(CONTRACTS_DIR);
        filenames = filenames.filter((filename) => {
            const filenameWithoutExtension = filename.replace('.json', '');
            return deployedContracts.includes(filenameWithoutExtension);
        });
        for (let i = 0; i < filenames.length; i += 1) {
            const filename = filenames[i];
            /* eslint-disable no-await-in-loop */
            await extractNetworkAddress(filename);
        }
        await updateTestnetJsons();
    } catch (err) {
        console.error('Failed with error:', err);
        process.exit(1);
    }
};

if (process.env.CI && process.env.CIRCLE_BRANCH === 'develop') {
    updateAddresses();
} else {
    console.error('Script can only be run in a CI environment');
    process.exit(1);
}
