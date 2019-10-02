const BN = require('bn.js');

/**
 * Helper module that contains key constants for our zero-knowledge proving system
 *
 * @module params
 */
const constants = {
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
     *  @constant K_MAX_TEST
     *  @type {string}
     *  @default 0
     */
    K_MAX_TEST: 14336,
    /** Minimum value that can be held in an AZTEC note
     *  @constant K_MIN
     *  @type { string }
     *  @default 0
     */
    K_MIN: 0,
    /** Minimum value that can be held in an AZTEC note during tests
     *  @constant K_MIN_TEST
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
     * @default 0xf4e5f833b89894c43804fdb171562eb9d2713b8d71777183712294f428c57775
     */
    ZERO_VALUE_NOTE_HASH: '0xf4e5f833b89894c43804fdb171562eb9d2713b8d71777183712294f428c57775',
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

// keccak256 hash of "MultipleNoteSignature(bytes32[] noteHashes,address spender,bool spenderApproval)"
const MULTIPLE_NOTE_SIGNATURE_TYPE_HASH = '0x9321aa36de6bbc3c63259b7706768d5842ee27bdc3b1700106a436528b89732e';

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
    MULTIPLE_NOTE_SIGNATURE: {
        types: {
            MultipleNoteSignature: [
                { name: 'noteHashes', type: 'bytes32[]' },
                { name: 'spender', type: 'address' },
                { name: 'spenderApproval', type: 'bool' },
            ],
            EIP712Domain: EIP712_DOMAIN,
        },
        primaryType: 'MultipleNoteSignature',
    },
    MULTIPLE_NOTE_SIGNATURE_TYPE_HASH,
    NOTE_SIGNATURE: {
        types: {
            NoteSignature: [
                { name: 'noteHash', type: 'bytes32' },
                { name: 'spender', type: 'address' },
                { name: 'spenderApproval', type: 'bool' },
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
