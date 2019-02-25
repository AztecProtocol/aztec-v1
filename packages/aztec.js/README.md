# Aztec.js

This library contains methods required to construct AZTEC zero-knowledge proofs, and to create the required [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) signatures in order to spend AZTEC notes.  

**IMPORTANT: The deployed AZTEC smart contracts use a trusted setup created by AZTEC in-house and should only be used for testing and development purposes. We will be launching a multiparty computation protocol to create a trusted setup that is secured by the wider Ethereum community, where only one person has to act honestly for the setup database to be secure. If you wish to participate please let us know at hello@aztecprotocol.com**
  
This repository is under active development, with our interfaces and smart contracts changing substantially as we prepare our Cryptography Engine. If you want to investigate the smart contracts and tooling that created our first zero-knowledge AZTEC transactions, please clone from the [`release-0.1.0`](https://github.com/AztecProtocol/AZTEC/tree/release-0.1.0) branch.

## Usage

Install the module:

```bash
$ npm install aztec.js
```

Then import it in your project:

```js
const aztec = require('aztec.js');
```

To see how this library can be used to issue AZTEC confidential transactions and create AZTEC notes, view our demonstration script and documentation in the [@aztec/demo](https://github.com/AztecProtocol/AZTEC/tree/master/packages/demo) package. For full API docs, view our [GitHub Pages website](https://aztecprotocol.github.io/AZTEC)

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Notation

Unless stated otherwise, public keys, private keys and addresses are encoded as hex-strings, prepended by the characters ```0x```.

### Install Modules

```bash
$ npm install
```

### Build

```bash
$ npm run build
```

### Clean

```bash
$ npm run clean
```

### Lint

```bash
$ npm run lint
```

### Test

```bash
$ npm run test
```

## Example

```node
const note = require('./src/note');
const proof = require('./proof/joinSplit');
const secp256k1 = require('./secp256k1');
const sign = require('./sign');

// address of confidential AZTEC - DAI smart contract
const aztecContract = '0x0000';

const accounts = [
    secp256k1.generateAccount(),
    secp256k1.generateAccount(),
];

const inputNotes = [
    note.create(accounts[0].publicKey, 80),
    note.create(accounts[0].publicKey, 60),
];

const outputNotes = [
    note.create(accounts[1].publicKey, 50),
    note.create(accounts[1].publicKey, 100),
];

const kPublic = -10; // input notes contain 10 fewer than output notes = deposit of 10 public tokens
const sender = accounts[0].address; // address of transaction sender

// proofData and challenge are ABI-encoded and ready to be used as inputs to an AZTEC smart contract
const { proofData, challenge } = proof.constructProof([...inputNotes, ...outputNotes], inputNotes.length, sender, kPublic);

// construct EIP712-compatible ECDSA signatures over input notes, required to spend input notes
const inputSignatures = [
    sign.signNote(proofData[0], challenge, sender, aztecContract, accounts[0].privateKey),
    sign.signNote(proofData[0], challenge, sender, aztecContract, accounts[0].privateKey),
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
