# AZTEC Demonstration Scripts

This package uses the [```aztec.js``](https://github.com/AztecProtocol/aztec-crypto-js) package to issue AZTEC confidential transactions, using AZTEC contracts deployed to the following networks:

* Ethereum Mainnet
* Rinkeby
* Kovan
* Ropsten

## Usage

In order to use these scripts, Ethereum private keys and addresses need to be added to ```accounts.json```; these are the accounts used to issue AZTEC transactions. The demo script currently requires three but you can modify it to fit your purposes.  

The demo script will, if used on the Ethereum mainnet, convert 10 DAI into zero-knowledge AZTEC notes, and then issue multiple AZTEC notes to the addresses in ```accounts.json```. If the first account in ```accounts.json``` does not have 10 DAI the transactions will throw. You can modify the amount of DAI transferred, the sizes of the AZTEC notes and their recipients in ```demoTransactions.js```.  

For the testnets, the AZTEC token smart contract is attached to a dummy ERC20 contract that anybody can mint from - the `demoTransactions.js` script will automatically mint tokens for you. 

You can deploy your own AZTEC contracts (attached to different ERC20 token contracts if you want) by running `truffle migrate`, specifying the appropriate network. If you're running this script on a local testnet, run ```truffle migrate``` to deploy the AZTEC contracts locally. See [the truffle docs](https://truffleframework.com/docs/truffle/getting-started/running-migrations) for more details.

1. run ```git clone git@github.com:AztecProtocol/AZTEC.git```
2. run ```git submodule update --init --recursive```  
3. followed by ```npm install``` && ```npm install ./aztec-crypto-js``` && ```npm install ./aztec-demo-js```  

Then, to test and deploy the contracts:

1. ```./node_modules/.bin/ganache-cli``` && ```truffle migrate```
2. set your private key or mnemonic in a `.env` file
3. run truffle tests with ```truffle test```
4. go the demo submodule ```cd aztec-demo-js```
5. run javascript tests with ```npm run test```

Finally, run the demo transactions script (to the appropriate network) with the following:

```bash
$ npm run demo:development (to a network running on port 8545)  
$ npm run demo:rinkeby  
$ npm run demo:kovan
$ npm run demo:ropsten
```

And if you want to venture out with *real money* on the mainnet:

```bash
$ npm run demo:mainnet
```

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

Please read our [contribution guidelines](https://github.com/AztecProtocol/aztec-monorepo/blob/master/CONTRIBUTING.md) before getting started.

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
