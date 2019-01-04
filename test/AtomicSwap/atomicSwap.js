/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');

// ### Internal Dependencies
const atomicSwapProof = require('../../aztec-crypto-js/proof/atomicSwapProof');
const { t2, GROUP_MODULUS } = require('../../aztec-crypto-js/params');

// ### Artifacts
const AtomicSwap = artifacts.require('./contracts/AZTEC/AtomicSwap');
const AtomicSwapInterface = artifacts.require('./contracts/AZTEC/AtomicSwapInterface');

const { toBytes32 } = require('../../aztec-crypto-js/utils/utils');

AtomicSwap.abi = AtomicSwapInterface.abi;
