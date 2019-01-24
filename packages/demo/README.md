# AZTEC Demonstration Scripts

This package uses the [```aztec.js``](https://github.com/AztecProtocol/aztec-crypto-js) package to issue AZTEC confidential transactions, using AZTEC contracts deployed to the following networks:

* Ethereum Mainnet
* Rinkeby
* Kovan
* Ropsten

## Pre Requisites

### Modules

```bash
$ npm install
```

## Usage

In order to use these scripts, Ethereum private keys and addresses need to be added to `accounts.json`; these are the accounts used to issue AZTEC transactions. The demo script currently requires three but you can modify it to fit your purposes.  

You can deploy your own AZTEC contracts (attached to different ERC20 token contracts if you want) by switching to the [contracts](https://github.com/AztecProtocol/AZTEC/tree/master/packages/contracts) package and running `truffle migrate`, specifying the appropriate network. See the [truffle docs](https://truffleframework.com/docs/truffle/getting-started/running-migrations) for more details.

### Testnets
The AZTEC token smart contract is attached to a dummy ERC20 contract that anybody can mint from. The `demoTransactions.js` script will automatically mint tokens for you.

Run the demo transactions script (to the appropriate network) with the following:

```bash
$ npm run demo:development # to a network running on port 8545
$ npm run demo:rinkeby
$ npm run demo:kovan
$ npm run demo:ropsten
```

### Mainnet
The demo script will convert 10 DAI into zero-knowledge AZTEC notes, and then issue multiple AZTEC notes to the addresses in `accounts.json`. If the first account in `accounts.json` does not have 10 DAI the transactions will throw. You can modify the amount of DAI transferred, the sizes of the AZTEC notes and their recipients in `demoTransactions.js`.  

So, to venture out with **real money** on the mainnet:

```bash
$ npm run demo:mainnet
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
