<p align="center"><img src="https://i.imgur.com/BxVHzD4.png" width="280px"/></p>

<p align="center"> AZTEC is an efficient zero-knowledge privacy protocol. The protocol powers real world financial applications on Ethereum mainnet today. A complete explanation of AZTEC can be found in our <a href="https://github.com/AztecProtocol/AZTEC/blob/master/AZTEC.pdf">white paper</a>.

<p align="center">
  <a href="https://circleci.com/gh/AztecProtocol/AZTEC">
    <img src="https://circleci.com/gh/AztecProtocol/AZTEC.svg?style=svg&circle-token=bb8aa4415af9d373eab3ee130a284e0c4874f65c" alt="CircleCI"/>
  </a>
  <a href="https://coveralls.io/github/AztecProtocol/AZTEC?branch=develop">
    <img src="https://coveralls.io/repos/github/AztecProtocol/AZTEC/badge.svg?branch=develop" alt="Coverage Status"/>
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="Semantic Release"/>
  </a>
  <a href="http://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen Friendly">
  </a>
  <a href="https://t.me/aztecprotocol">
    <img src="https://img.shields.io/badge/chat-telegram-0088CC.svg?style=flat" alt="Twitter"/>
  </a>
  <a href="https://www.gnu.org/licenses/lgpl-3.0">
    <img src="https://img.shields.io/badge/License-LGPL%20v3-008033.svg" alt="License: LGPL v3">
  </a>
</p>

---

## Documentation :books:

There are two key sources of documentation:

1. Protocol specification: https://github.com/AztecProtocol/specification
2. Our client side SDK: https://docs.aztecprotocol.com

## Packages :package:

AZTEC is maintained as a monorepo with multiple sub packages. Please find a comprehensive list below.

### JavaScript Packages

| Package                                                     | Version                                                                                                                       | Description                                                                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`aztec.js`](/packages/aztec.js)                            | [![npm](https://img.shields.io/npm/v/aztec.js.svg)](https://www.npmjs.com/package/aztec.js)                                   | An aggregate package combining many smaller utility packages for interacting with the AZTEC Protocol |
| [`@aztec/contract-artifacts`](/packages/contract-artifacts) | [![npm](https://img.shields.io/npm/v/@aztec/contract-artifacts.svg)](https://www.npmjs.com/package/@aztec/contract-artifacts) | AZTEC smart contract compiled artifacts                                                              |
| [`@aztec/contract-addresses`](/packages/contract-addresses) | [![npm](https://img.shields.io/npm/v/@aztec/contract-addresses.svg)](https://www.npmjs.com/package/@aztec/contract-addresses) | A tiny utility library for getting known deployed contract addresses for a particular network        |
| [`@aztec/dev-utils`](/packages/dev-utils)                   | [![npm](https://img.shields.io/npm/v/@aztec/dev-utils.svg)](https://www.npmjs.com/package/@aztec/dev-utils)                   | Dev utils to be shared across AZTEC projects and packages                                            |

### Solidity Packages

| Package                                 | Version                                                                                                   | Description                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [`@aztec/protocol`](/packages/protocol) | [![npm](https://img.shields.io/npm/v/@aztec/protocol.svg)](https://www.npmjs.com/package/@aztec/protocol) | AZTEC solidity smart contracts & tests |

### Private Packages

| Package                                                 | Description                       |
| ------------------------------------------------------- | --------------------------------- |
| [`@aztec/monorepo-scripts`](/packages/monorepo-scripts) | Scripts for managing the monorepo |

## Usage :hammer_and_pick:

To create AZTEC notes and construct zero-knowledge proofs:

```bash
$ yarn add aztec.js
```

Other goodies:

```bash
$ yarn add @aztec/contract-artifacts
$ yarn add @aztec/contract-addresses
$ yarn add @aztec/dev-utils
```

To see a demo, head to this [tutorial](https://github.com/AztecProtocol/aztec-ganache-starter-kit).

For more information, check out our [documentation](https://aztecprotocol.github.io/AZTEC/).

## Contributing :raising_hand_woman:

### Requirements

-   node >=8.3
-   yarn >=1.15.2
-   solidity >=0.5.0 <0.6.0

### Pre Requisites

Make sure you are using Yarn >= 1.15.2. To install using brew:

```bash
brew install yarn
```

Then install dependencies:

```bash
yarn install
```

### Build

To build all packages:

```bash
$ yarn build
```

To build a specific package:

```bash
$ PKG=aztec.js yarn build
```

### Watch

To re-build all packages on change:

```bash
$ yarn watch
```

### Clean

To clean all packages:

```bash
$ yarn clean
```

To clean a specific package:

```bash
$ PKG=aztec.js yarn clean
```

### Lint

To lint all packages:

```bash
$ yarn lint
```

To lint a specific package:

```bash
$ PKG=aztec.js yarn lint
```

### Test

To run all tests:

```bash
$ yarn test
```

To run tests in a specific package:

```bash
$ PKG=aztec.js yarn test
```

## FAQ :question:

### What is the AZTEC Protocol?

The protocol enables transactions of value, where the _values_ of the transaction are encrypted. The AZTEC protocol smart contract validator, `AZTEC.sol`, validates a unique zero-knowledge proof that determines the legitimacy of a transaction via a combination of **homomorphic encryption** and **range proofs**.

### What is encrypted 'value'?

Instead of balances, the protocol uses AZTEC **notes**. A note encrypts a number that represents a value (for example a number of ERC-20 tokens). Each note has an owner, defined via an Ethereum address. In order to _spend_ a note the owner must provide a valid ECDSA signature attesting to this.

### What does this enable?

#### Confidential representations of ERC20-tokens

The AZTEC protocol can enable confidential transactions for _any_ generic digital asset on Ethereum, including _existing_ assets. Our [first deployed asset](https://etherscan.io/address/0xc5c0B2E7a265c96D29aE1E4e70Cd542deDc87aee) enables zkDai.

#### Fully confidential digital assets

The AZTEC protocol can be utilized as a stand-alone confidential token, with value transfers described entirely through AZTEC **join-split** transactions

### How much gas do these transactions cost?

The gas costs scale with the number of input and output notes in a **join-split** transaction. For a fully confidential transfer, with 2 input notes and 2 output notes, the gas cost is approximately 300,000 gas.

### Where can I see this in action?

The AZTEC protocol is [live today on the Ethereum main-net](https://twitter.com/aztecprotocol/status/1225152974596530187). [Here is an example AZTEC join-split transaction](https://etherscan.io/tx/0x8c35f5e081716a4cf9b5e71071403036dd4bf771360a146e4d6465fa4e24bd69).

### Range proofs you say? How does that work?

Read the AZTEC paper [here](https://github.com/AztecProtocol/AZTEC/blob/master/AZTEC.pdf). The unique AZTEC commitment function enables the efficient construction and verification of range proofs. The protocol requires a trusted setup protocol, that generates a dataset that is required to construct AZTEC zero-knowledge proofs

#### The Trusted Setup

AZTEC ran Ignition, an MPC ceremony to generate a CRS for our privacy network and other zero-knowledge systems like PLONK from October 25th 2019 to the January 2nd 2020. 176 individuals and institutions took part, each generating randomness and adding it to the previous participant's contribution. If even one participant acts honestly and destroys the randomness they generated, the CRS can be trusted. You can see a recap of Ignition [here](https://medium.com/aztec-protocol/aztec-crs-the-biggest-mpc-setup-in-history-has-successfully-finished-74c6909cd0c4).

### Are AZTEC transactions anonymous as well as confidential?

The AZTEC protocol currently only supports confidentiality of amounts. We will be adding User privacy and Data privacy to the protocol and SDK.

### This sounds interesting! How can I get involved?

Anybody wishing to become early members of the AZTEC network please get in touch at hello@aztecprotocol.com
