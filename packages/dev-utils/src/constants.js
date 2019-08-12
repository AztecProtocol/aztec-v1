const BN = require('bn.js');

// Precomputed values from MPC setup
const H_X = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
const H_Y = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);
const t2 = [
    '0x01cf7cc93bfbf7b2c5f04a3bc9cb8b72bbcf2defcabdceb09860c493bdf1588d',
    '0x08d554bf59102bbb961ba81107ec71785ef9ce6638e5332b6c1a58b87447d181',
    '0x204e5d81d86c561f9344ad5f122a625f259996b065b80cbbe74a9ad97b6d7cc2',
    '0x02cb2a424885c9e412b94c40905b359e3043275cd29f5b557f008cd0a3e0c0dc',
];
/**
 * Helper module that contains key constants for our zero-knowledge proving system
 *
 * @module params
 */
const constants = {
    /**
     * Common reference string
     * @constant CRS
     * @type {string}
     */
    CRS: [`0x${H_X.toString(16)}`, `0x${H_Y.toString(16)}`, ...t2],
    /**
     * Generic scaling factor that maps between AZTEC note values and ERC20 token balances. When used for DAI,
     * 1 note value = 0.1 DAI
     */
    ERC20_SCALING_FACTOR: new BN('100000000000000000', 10),
    /** Maximum value that can be held in an AZTEC Note
     *  @constant K_MAX
     *  @type {string}
     *  @default 1048576
     */
    K_MAX: 1048576,
    /** Maximum value that can be held in an AZTEC note during tests
     *  @constant K_MIN
     *  @type {string}
     *  @default 0
     */
    K_MAX_TEST: 14336,
    /** Minimum value that can be held in an AZTEC note
     *  @constant K_MAX_TEST
     *  @type { string }
     *  @default 0
     */
    K_MIN: 0,
    /** Minimum value that can be held in an AZTEC note during tests
     *  @constant K_MAX_TEST
     *  @type { string }
     *  @default 10240
     */
    K_MIN_TEST: 0,
    /** Number of signatures per file in trusted setup database
     *  @constant SIGNATURES_PER_FILE
     *  @type {number}
     *  @default 1024
     */
    SIGNATURES_PER_FILE: 1024,
    /**
     * BN value equal to 0
     */
    ZERO_BN: new BN(0),
    /**
     * Hash of a dummy AZTEC note with k = 0 and a = 1
     * @constant ZERO_VALUE_NOTE_HASH
     * @type {string}
     * @default 0xcbc417524e52b95c42a4c42d357938497e3d199eb9b4a0139c92551d4000bc3c
     */
    ZERO_VALUE_NOTE_HASH: '0xcbc417524e52b95c42a4c42d357938497e3d199eb9b4a0139c92551d4000bc3c',
};

/**
 * Common addresses
 */
constants.addresses = {
    /**
     * Address of the DAI smart contract on Ethereum
     * @constant DAI_ADDRESS
     * @type {string}
     * @default '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
     */
    DAI_ADDRESS: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    /**
     * Generic burning Ethereum address
     */
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
};

/**
 * Domains, schemas and signature related to EIP712
 */
const EIP712_DOMAIN = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'verifyingContract', type: 'address' },
];

// keccak256 hash of "EIP712Domain(string name,string version,address verifyingContract)"
const EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = '0x91ab3d17e3a50a9d89e63fd30b92be7f5336b03b287bb946787a83a9d62a2766';

// keccak256 hash of "JoinSplitSignature(uint24 proof,bytes32 noteHash,uint256 challenge,address sender)"
const JOIN_SPLIT_SIGNATURE_TYPE_HASH = '0xf671f176821d4c6f81e66f9704cdf2c5c12d34bd23561179229c9fe7a9e85462';

// keccak256 hash of "NoteSignature(bytes32 noteHash,address spender,bool status)"
const NOTE_SIGNATURE_TYPE_HASH = '0x9fe730639297761b7154c4543e5b6d06ca424c8b46480a40d3181296d5c35815';

constants.eip712 = {
    ACE_DOMAIN_PARAMS: {
        name: 'AZTEC_CRYPTOGRAPHY_ENGINE',
        version: '1',
    },
    AZTEC_RINKEBY_DOMAIN_PARAMS: {
        name: 'AZTEC_RINKEBY_DOMAIN',
        version: '1',
        salt: '0x210db872dec2e06c375dd40a5a354307bb4ba52ba65bd84594554580ae6f0639',
    },
    AZTEC_MAINNET_DOMAIN_PARAMS: {
        name: 'AZTEC_MAINNET_DOMAIN',
        version: '1',
        salt: '0x210db872dec2e06c375dd40a5a354307bb4ba52ba65bd84594554580ae6f0639',
    },
    EIP712_DOMAIN,
    EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
    JOIN_SPLIT_SIGNATURE: {
        types: {
            JoinSplitSignature: [
                { name: 'proof', type: 'uint24' },
                { name: 'noteHash', type: 'bytes32' },
                { name: 'challenge', type: 'uint256' },
                { name: 'sender', type: 'address' },
            ],
            EIP712Domain: EIP712_DOMAIN,
        },
        primaryType: 'JoinSplitSignature',
    },
    JOIN_SPLIT_SIGNATURE_TYPE_HASH,
    NOTE_SIGNATURE: {
        types: {
            NoteSignature: [
                { name: 'noteHash', type: 'bytes32' },
                { name: 'spender', type: 'address' },
                { name: 'status', type: 'bool' },
            ],
            EIP712Domain: EIP712_DOMAIN,
        },
        primaryType: 'NoteSignature',
    },
    NOTE_SIGNATURE_TYPE_HASH,
    ZK_ASSET_DOMAIN_PARAMS: {
        name: 'ZK_ASSET',
        version: '1',
    },
};

/**
 *  Statuses
 */
constants.statuses = {
    NOTE_DOES_NOT_EXIST: 0,
    NOTE_UNSPENT: 1,
    NOTE_SPENT: 2,
};

module.exports = constants;
