<p align="center"><img src="https://i.imgur.com/BaalNC8.jpg" width="280px"/></p>

<p align="center"> AZTEC is an efficient zero-knowledge privacy protocol and decentralised exchange. The protocol powers real world financial applications on Ethereum mainnet today. A complete explanation of AZTEC can be found in our <a href="https://github.com/AztecProtocol/AZTEC/blob/master/AZTEC.pdf">white paper</a>.</p>

<p align="center">
 <a href="https://circleci.com/gh/AztecProtocol/aztec-monorepo">
    <img src="https://circleci.com/gh/AztecProtocol/aztec-monorepo.svg?style=svg&circle-token=12d232f83d560e96efe05c6cb106933a75bf07f5" alt="CircleCI"/>
  </a>
  <!-- <a href="https://coveralls.io/github/AztecProtocol/aztec-monorepo?branch=develop">
    <img src="https://coveralls.io/repos/github/AztecProtocol/aztec-monorepo/badge.svg" alt="Coveralls"/>
  </a> -->
  <a href="https://lernajs.io/">
    <img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="Lerna"/>
  </a>
  <a href="https://telegram.com">
    <img src="https://img.shields.io/badge/chat-telegram-0088cc.svg?style=flat" alt="Telegram"/>
  </a>
  <a href="https://www.gnu.org/licenses/lgpl-3.0">
    <img src="https://img.shields.io/badge/License-LGPL%20v3-008033.svg" alt="License: LGPL v3">
  </a>
</p>

---

## Packages :package:

AZTEC is maintained as a monorepo with multiple sub packages. Please find a comprehensive list below.

### JavaScript Packages

| Package                                                     | Version                                                                                                                      | Description                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`aztec.js`](/packages/aztec.js)                            | [![npm](https://img.shields.io/npm/v/aztec.js.svg)](https://www.npmjs.com/package/aztec.js)                                  | An aggregate package combining many smaller utility packages for interacting with the Aztec protocol |
| [`@aztec/artifacts`](/packages/artifacts) | [![npm](https://img.shields.io/npm/v/@aztec/artifacts.svg)](https://www.npmjs.com/package/@aztec/contract-artifacts)                           | Aztec smart contract compiled artifacts                                                           |
| [`@aztec/contract-addresses`](/packages/contract-addresses) | [![npm](https://img.shields.io/npm/v/@aztec/contract-addresses.svg)](https://www.npmjs.com/package/@aztec/contract-addresses)| A tiny utility library for getting known deployed contract addresses for a particular network.    |

### Private Packages

| Package                                            | Description                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`@aztec/contracts`](/packages/contracts)          | Aztec Protocol solidity smart contracts & tests                                  |
| [`@0x/demo`](/packages/demo)                       | Demo of Aztec written in javascript                                              |

## Usage :hammer_and_pick:

Node version >= 4 and Solidity 0.4.24 are required.

To use our deployed contracts' ABI and addresses:

```bash
$ npm install @aztec/artifacts @aztec/contract-addresses --save
```

To fiddle with our cryptography engine and create your own AZTEC notes:

```bash
$ npm install aztec.js --save
```

To see a demo:

```bash
git clone git@github.com:AztecProtocol/AZTEC.git
cd AZTEC/packages/demo
npm install
npm run test
```

For more information, check out our [documentation](https://readthedocs.org/).

## Contributing :raising_hand_woman:

### Requirements

- node ^4.0.0 and npm^2.14.2

### Pre Requisites

```bash
$ npm install lerna@^3.10.6 --global
$ npm install truffle@^5.0.0 --global
```

### Build

To install the node modules in all packages:

```bash
$ lerna exec -- npm install
```

To build all packages:

```bash
$ lerna run build
```

To build a specific package:

```bash
$ lerna run build --scope aztec.js
```

### Clean

To clean all packages:

```bash
$ lerna run clean
```

To clean a specific package:

```bash
$ lerna run clean --scope aztec.js
```

### Lint

To lint all packages:

```bash
$ lerna run lint
```

To lint a specific package:

```bash
$ lerna run lint --scope aztec.js
```

### Run Tests

To run all tests:

```bash
$ lerna run test
```

To run tests in a specific package:

```bash
$ lerna run test --scope aztec.js
```
