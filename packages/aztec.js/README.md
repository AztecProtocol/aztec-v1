## Aztec.js

This library contains the methods required to construct AZTEC zero-knowledge proofs.

It also contains various utility functions, such as methods to appropriately ABI encode the proofs and to construct the EIP712 signatures [EIP712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) required to spend AZTEC notes.

## Usage

Install the module:

```bash
$ yarn add aztec.js
```

Then import it in your project:

```js
const aztec = require('aztec.js');
```

To see how this library can be used to issue AZTEC confidential transactions and create AZTEC notes, view our demonstration script and documentation in the [aztec-ganache-starter-kit](https://github.com/AztecProtocol/aztec-ganache-starter-kit/blob/master/test/demo.js) package. For full API docs, view our [GitHub Pages website](https://aztecprotocol.github.io/AZTEC)

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../.github/CONTRIBUTING.md) before getting started.

### Notation

Unless stated otherwise, public keys, private keys and addresses are encoded as hex-strings, prepended by the characters `0x`.

### Install Modules

```bash
$ yarn install
```

### Build

```bash
$ yarn build
```

### Clean

```bash
$ yarn clean
```

### Lint

```bash
$ yarn lint
```

### Test

```bash
$ yarn test
```

## Example

```node
const { JoinSplitProof, note } = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');

// dummy address of confidential AZTEC - DAI smart contract
const validatorAddress = '0x76581320dCdFFC93E2FFFF7DADfE668Ba55796a9';

const accounts = [secp256k1.generateAccount(), secp256k1.generateAccount()];

const inputNotes = [await note.create(accounts[0].publicKey, 80), await note.create(accounts[0].publicKey, 60)];

const outputNotes = [await note.create(accounts[1].publicKey, 50), await note.create(accounts[1].publicKey, 100)];

const publicValue = -10; // input notes contain 10 fewer than output notes = deposit of 10 public tokens
const sender = accounts[0].address; // address of transaction sender
const publicOwner = accounts[0].address; // address of public token owner

const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

// data can be directly fed into an ZkAsset.sol contract's confidentialTransfer method
const data = proof.encodeABI(validatorAddress);

console.log('data', data);
```
