# AZTEC Demonstration Scripts

This directory uses the [```aztec-crypto-js```](https://github.com/AztecProtocol/aztec-crypto-js) library to issue AZTEC confidential transactions, using AZTEC contracts deployed to the following networks:

* Main-net
* Rinkeby
* Kovan
* Ropsten

In order to use these scripts, Ethereum private keys and addresses need to be added to ```accounts.json```; these are the accounts used to issue AZTEC transactions. The demo script currently requires three but you can modify it to fit your purposes.  

The demo script will, if used on the Ethereum main-net, convert 10 DAI into zero-knowledge AZTEC notes, and then issue multiple AZTEC notes to the addresses in ```accounts.json```. If the first account in ```accounts.json``` does not have 10 DAI the transactions will throw. You can modify the amount of DAI transferred, the sizes of the AZTEC notes and their recipients in ```demoTransactions.js```.  

For the test-nets, the AZTEC token smart contract is attached to a dummy ERC20 contract that anybody can mint from - the ```demoTransactions.js``` script will automatically mint tokens for you.

You can deploy your own AZTEC contracts (attached to different ERC20 token contracts if you want) by running ```truffle migrate```, specifying the appropriate network. See [the truffle docs](https://truffleframework.com/docs/truffle/getting-started/running-migrations) for more details.  

If you're running this script on a local test-net, run ```truffle migrate``` to deploy the AZTEC contracts locally.

## API Docs

API documentation can be found on our [github pages site](https://aztecprotocol.github.io/AZTEC/).

## Usage

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

```npm run demo:development``` (to a network running on port 8545)  
```npm run demo:rinkeby```  
```npm run demo:kovan```  
```npm run demo:ropsten```  
```npm run demo:mainnet```  
