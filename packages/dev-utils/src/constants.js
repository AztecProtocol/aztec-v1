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
     *  @default 10e6
     */
    K_MAX: 10000000,
    /** Maximum value that can be held in an AZTEC note during tests
     *  @constant K_MAX_TEST
     *  @type {string}
     *  @default 0
     */
    K_MAX_TEST: 16000,
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
    SIGNATURES_PER_FILE: 1000,
    /**
     * BN value equal to 0
     */
    ZERO_BN: new BN(0),
    /**
     * Hash of a dummy AZTEC note with k = 0 and a = 1
     * @constant ZERO_VALUE_NOTE_HASH
     * @type {string}
     * @default 0x26d21f105b054b61e8d9680855c3af0633bd7c140b87de95f0ac218046fc71db
     */
    ZERO_VALUE_NOTE_HASH: '0x26d21f105b054b61e8d9680855c3af0633bd7c140b87de95f0ac218046fc71db',
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

const EIP712_DOMAIN_CHAIN_ID = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];

// keccak256 hash of "EIP712Domain(string name,string version,address verifyingContract)"
const EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = '0x91ab3d17e3a50a9d89e63fd30b92be7f5336b03b287bb946787a83a9d62a2766';

// keccak256 hash of "JoinSplitSignature(uint24 proof,bytes32 noteHash,uint256 challenge,address sender)"
const JOIN_SPLIT_SIGNATURE_TYPE_HASH = '0xf671f176821d4c6f81e66f9704cdf2c5c12d34bd23561179229c9fe7a9e85462';

// keccak256 hash of "ProofSignature(bytes32 proofHash,address spender,bool approval)"
const PROOF_SIGNATURE_TYPE_HASH = '0x362143c749023e4b48ee5f2724d3d2bcbaea3c7eada19126ebd60fb7e2e72645';

// keccak256 hash of "NoteSignature(bytes32 noteHash,address spender,bool spenderApproval)"
const NOTE_SIGNATURE_TYPE_HASH = '0x18b99aa73a945da0bb8640ca1f178720091ea7d80be44da6ee02d9fd334623c2';

constants.eip712 = {
    ACE_DOMAIN_PARAMS: {
        name: 'AZTEC_CRYPTOGRAPHY_ENGINE',
        version: '1',
    },
    ACCOUNT_REGISTRY_DOMAIN_PARAMS: {
        name: 'AccountRegistry',
        version: '2',
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
    DAI_DOMAIN_PARAMS: {
        name: 'Dai Stablecoin',
        version: '1',
    },
    EIP712_DOMAIN,
    EIP712_DOMAIN_CHAIN_ID,
    EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
    ACCOUNT_REGISTRY_SIGNATURE: {
        types: {
            AZTECAccount: [
                { name: 'account', type: 'address' },
                { name: 'linkedPublicKey', type: 'bytes' },
                { name: 'AZTECaddress', type: 'address' },
            ],
            EIP712Domain: EIP712_DOMAIN,
        },
        primaryType: 'AZTECAccount',
    },
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
    PERMIT_SIGNATURE: {
        types: {
            Permit: [
                { name: 'holder', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'expiry', type: 'uint256' },
                { name: 'allowed', type: 'bool' },
            ],
            EIP712Domain: EIP712_DOMAIN_CHAIN_ID, // compatible with DAI contract
        },
        primaryType: 'Permit',
    },
    PROOF_SIGNATURE: {
        types: {
            ProofSignature: [
                { name: 'proofHash', type: 'bytes32' },
                { name: 'spender', type: 'address' },
                { name: 'approval', type: 'bool' },
            ],
            EIP712Domain: EIP712_DOMAIN,
        },
        primaryType: 'ProofSignature',
    },
    PROOF_SIGNATURE_TYPE_HASH,
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
