const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const H_X = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
const H_Y = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);
const t2 = [
    `0x${padLeft('1cf7cc93bfbf7b2c5f04a3bc9cb8b72bbcf2defcabdceb09860c493bdf1588d', 64)}`,
    `0x${padLeft('8d554bf59102bbb961ba81107ec71785ef9ce6638e5332b6c1a58b87447d181', 64)}`,
    `0x${padLeft('204e5d81d86c561f9344ad5f122a625f259996b065b80cbbe74a9ad97b6d7cc2', 64)}`,
    `0x${padLeft('2cb2a424885c9e412b94c40905b359e3043275cd29f5b557f008cd0a3e0c0dc', 64)}`,
];
const CRS = [
    `0x${padLeft(H_X.toString(16), 64)}`,
    `0x${padLeft(H_Y.toString(16), 64)}`,
    ...t2,
];

/**
 * Helper module that contains key constants for our zero-knowledge proving system
 *
 * @module params
 */
const constants = {
    /**
     * Common reference string
     */
    CRS,
    /**
     * Generic scaling factor that maps between AZTEC note values and ERC20 token balances.
     * when used for DAI token, 1 AZTEC note value = 0.1 DAI
     */
    ERC20_SCALING_FACTOR: new BN('100000000000000000', 10),
    /**
     * Dummy network id used in contract testing
     */
    FAKE_NETWORK_ID: 100,
    /** modulus of bn128 curve's finite field (p)
     *  @constant FIELD_MODULUS
     *  @type {BN}
     *  @default 21888242871839275222246405745257275088696311157297823662689037894645226208583
     */
    FIELD_MODULUS: new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10),
    /** modulus of bn128's elliptic curve group (n)
     *  @constant GROUP_MODULUS
     *  @type {BN}
     *  @default 21888242871839275222246405745257275088548364400416034343698204186575808495617
     */
    GROUP_MODULUS: new BN('21888242871839275222246405745257275088548364400416034343698204186575808495617', 10),
    /**
     * X-Coordinate of AZTEC's second generator point 'h'.
     *      Created by taking the keccak256 hash of the asci string 'just read the instructions', right-padded to 32 bytes.  
     *      i.e: 0x6A75737420726561642074686520696E737472756374696F6E73000000000000.  
     *      H_X is the result of this hash, modulo the elliptic curve group modulus n.
     *  @constant H_X
     *  @type {BN}
     *  @default 7673901602397024137095011250362199966051872585513276903826533215767972925880
     */
    H_X,
    /** Y-Coordinate of AZTEC's second generator point 'h'. Created from odd-valued root of (H_X^{3} + 3)
     *  @constant H_Y
     *  @type {BN}
     *  @default 8489654445897228341090914135473290831551238522473825886865492707826370766375
     */
    H_Y,
    /** Maximum value that can be held in an AZTEC Note
     *  @constant K_MAX
     *  @type {string}
     *  @default 1048576
     */
    K_MAX: 1048576,
    /** Minimum value of an AZTEC Note
     *  @constant K_MIN
     *  @type {string}
     *  @default 0
     */
    K_MIN: 0,
    /** bytes32-formatted trusted setup public key
     *  @constant t2
     *  @type {BN}
     */
    t2,
    /** Number of signatures per file in trusted setup database
     *  @constant SIGNATURES_PER_FILE
     *  @type {number}
     *  @default 1024
     */
    SIGNATURES_PER_FILE: 1024,
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
 * Error codes for use during proof construction
 */
constants.errorTypes = {
    SCALAR_TOO_BIG: 'SCALAR_TOO_BIG',
    SCALAR_IS_ZERO: 'SCALAR_IS_ZERO',
    X_TOO_BIG: 'X_TOO_BIG',
    Y_TOO_BIG: 'Y_TOO_BIG',
    NOT_ON_CURVE: 'NOT_ON_CURVE',
    BAD_BLINDING_FACTOR: 'BAD_BLINDING_FACTOR',
    KPUBLIC_MALFORMED: 'KPUBLIC_MALFORMED',
    VIEWING_KEY_MALFORMED: 'VIEWING_KEY_MALFORMED',
    M_TOO_BIG: 'M_TOO_BIG',
    BAD_K: 'BAD_K',
    GAMMA_IS_INFINITY: 'GAMMA_IS_INFINTY',
    SIGMA_IS_INFINTY: 'SIGMA_IS_INFINITY',
    NO_ADD_CHALLENGEVAR: 'NO_ADD_CHALLENGEVAR',
    INCORRECT_NOTE_NUMBER: 'INCORRECT_NOTE_NUMBER',
    GAMMA_SIGMA_NOT_ON_CURVE: 'GAMMA_SIGMA_NOT_ON_CURVE',
    CHALLENGE_RESPONSE_FAIL: 'CHALLENGE_RESPONSE_FAIL',
    KA_TOO_BIG: 'KA_TOO_BIG',
    KB_TOO_BIG: 'KB_TOO_BIG',
    ZA_TOO_BIG: 'ZA_TOO_BIG',
    ZB_TOO_BIG: 'ZB_TOO_BIG',
    BLINDING_FACTOR_IS_NULL: 'BLINDING_FACTOR_IS_NULL',
    POINT_AT_INFINITY: 'POINT_AT_INFINITY',
    NOTE_VALUE_TOO_BIG: 'NOTE_VALUE_TOO_BIG',
    SHOULD_THROW_IS_UNDEFINED: 'SHOULD_THROW_IS_UNDEFINED',
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
