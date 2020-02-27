## Protocol

This package contains the core smart contracts of the AZTEC Protocol. The contracts are written in solidity and yul.

## Pre Requisites

### Truffle

```bash
$ yarn global add truffle
$ yarn global add ganache-cli
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

Please read our [contribution guidelines](../../.github/CONTRIBUTING.md) before getting started.

### Install Modules

```bash
$ yarn install
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
