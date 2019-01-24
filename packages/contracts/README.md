# Contracts

This package contains the core smart contracts of the AZTEC Protocol. The contracts are written in solidity and yul.

**IMPORTANT: The deployed AZTEC smart contracts use a trusted setup created by AZTEC in-house and should only be used for testing and development purposes. We will be launching a multiparty computation protocol to create a trusted setup that is secured by the wider Ethereum community, where only one person has to act honestly for the setup database to be secure. If you wish to participate please let us know at hello@aztecprotocol.com**

## Pre Requisites

### Truffle

```bash
$ npm install truffle@^5.0.0 --global
```

### Modules

```bash
$ npm install
```

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](https://github.com/AztecProtocol/AZTEC/blob/master/CONTRIBUTING.md) before getting started.

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

### Compile

If you add changes to this package, use truffle to recompile and verify the integrity of your contracts:

```bash
truffle compile --all
```
