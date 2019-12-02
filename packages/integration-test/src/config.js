const BN = require('bn.js');
const {
    constants: { ERC20_SCALING_FACTOR },
} = require('@aztec/dev-utils');

/**
 * @module config
 *
 * config file to setup the integration test according to the specific scenario and environment the
 * user wishes to test. Parameters that can be customised according to the test include:
 * - testNet to run the integration test on
 * - contracts to be tested
 * - number of tokens that are involved in the full test suite, and therefore should be minted
 * - flags controlling whether particular tests, such as minting, burning and upgrade paths, should be run
 */
const config = {};

/**
 * @param {String[]} contractsToDeploy - names of the various contracts for which Truffle contracts,
 * representing those contracts deployed on the relevant testNet, should be created. These Truffle
 * contracts will then be used for the relevant integration test
 */
config.contractsToDeploy = [
    'ACE',
    'Dividend',
    'ERC20Mintable',
    'FactoryAdjustable201907',
    'JoinSplit',
    'JoinSplitFluid',
    'PrivateRange',
    'PublicRange',
    'Swap',
    'ZkAssetAdjustable',
];

/**
 * @constant {string} NETWORK - name of the test network for which the integration test is to be run.
 * Extracted from the argument passed to the truffle test command - it is the last argument to be passed
 */
config.NETWORK = process.argv[process.argv.length - 1];

/**
 * @constant numTestTokens - number of ERC20 tokens used during the integration test,
 * and therefore the required minimum balance of the spending account
 */
config.numTestTokens = new BN(260);

/**
 * @param {Bool} runAdjustSupplyTests - flag determining whether the adjust supply related integration
 * tests should be run. Set to true if so, false if not
 *
 * Currently necessary as the test suite does not yet support same asset repeated minting/burning
 */
config.runAdjustSupplyTests = false;

/**
 * @param {bool} runUpgrade - flag determining whether the test that performs a note registry upgrade
 * should be performed. If true, perform the upgrade test
 *
 */
config.runUpgrade = false;

/**
 * @param {BN} SCALING_FACTOR - factor to convert between AZTEC note value and ERC20 token value
 */
config.scalingFactor = ERC20_SCALING_FACTOR;

module.exports = config;
