# aztec-crypto-js

This library contains methods required to construct AZTEC zero-knowledge proofs, and to create the required [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) signatures in order to spend AZTEC notes.  

**IMPORTANT: The deployed AZTEC smart contracts use a trusted setup created by AZTEC and should only be used for testing and development purposes. We will be launching a multiparty computation protocol to create a trusted setup that is secured by the wider Ethereum community. (TODO add how to participate)**

To see how this library can be used to issue AZTEC confidential transactions and create AZTEC notes, view our demonstration script and documentation in ```demo```.  

For full API docs, view our github pages API at (TODO, ahem...)

## Install

clone this repo to your desired directory and run ```npm install```

## Usage

```
const note = require('./note/note');
const proof = require('./proof/proof');
const secp256k1 = require('./secp256k1/secp256k1');
const sign = require('./eip712/sign');

// address of confidential AZTEC - DAI smart contract
const aztecContract = '0x0000';
// main-net chain Id
const chainId = 1;

const accounts = [
    secp256k1.generateAccount(),
    secp256k1.generateAccount(),
];

const inputNotes = [
    note.create(accounts[0].publicKey, 100),
    note.create(accounts[0].publicKey, 50),
];

const outputNotes = [
    note.create(accounts[1].publicKey, 80),
    note.create(accounts[1].publicKey, 60),
];

const kPublic = -10; // output notes contain 10 less than input notes = deposit of 10 public tokens
const sender = accounts[0].address; // address of transaction sender

// proofData and challenge are ABI-encoded and ready to be used as inputs to an AZTEC smart contract
const { proofData, challenge } = proof.constructJoinSplit([...inputNotes, ...outputNotes], inputNotes.length, sender, kPublic);

// construct EIP712-compatible ECDSA sigantures over input notes, required to spend input notes
const inputSignatures = [
    sign.signNote(proofData[0], challenge, sender, aztecContract, accounts[0].privateKey, chainId),
    sign.signNote(proofData[0], challenge, sender, aztecContract, accounts[0].privateKey, chainId),
];

const outputOwners = [accounts[1].address, accounts[1].address];

// transactionData's members can be directly fed into an AZTECERC20Bridge.sol contract's confidentialTransfer method
const transactionData = {
    proofData,
    m: inputNotes.length,
    challenge,
    inputSignatures,
    outputOwners,
    metadata: note.encodeMetadata(outputNotes),
};

return transactionData;
```

## Notation

Unless stated otherwise, public keys, private keys and addresses are encoded as hex-strings, prepended by the characters ```0x```.