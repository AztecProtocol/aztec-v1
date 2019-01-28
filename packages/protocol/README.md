# Protocol

This package contains the core smart contracts of the AZTEC Protocol. The contracts are written in solidity and yul.

**IMPORTANT: The deployed AZTEC smart contracts use a trusted setup created by AZTEC in-house and should only be used for testing and development purposes. We will be launching a multiparty computation protocol to create a trusted setup that is secured by the wider Ethereum community, where only one person has to act honestly for the setup database to be secure. If you wish to participate please let us know at hello@aztecprotocol.com**

## Pre Requisites

### Truffle

```bash
$ npm install truffle@^5.0.0 --global
$ npm install ganache-cli --global
```

## Usage

To venture out with the contracts, just compile and deploy them with truffle:

```bash
truffle compile --all
truffle migrate --network development
```

Make sure to have a running ganache instance in the background.

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Modules

```bash
$ npm install
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
