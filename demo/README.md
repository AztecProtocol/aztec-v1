# AZTEC Demonstration Scripts

This directory uses the ```aztec-crypto-js``` library to issue AZTEC confidential transactions, using AZTEC contracts deployed to the following networks:

* Main-net
* Rinkeby
* Kovan
* Ropsten

In order to use these scripts, Ethereum private keys and addresses need to be added to ```accounts.json```; these are the accounts used to issue AZTEC transactions. The demo script currently requires three but you can modify it to fit your purposes.  

The demo script will, if used on the Ethereum main-net, convert 10 DAI into zero-knowledge AZTEC notes, and then issue multiple AZTEC notes to the addresses in ```accounts.json```. If the first account in ```accounts.json``` does not have 10 DAI the transactions will throw. You can modify the amount of DAI transferred, the sizes of the AZTEC notes and their recipients in ```demoTransactions.js```.  

For the test-nets, the AZTEC token smart contract is attached to a dummy ERC20 contract that anybody can mint from - the ```demoTransactions.js``` script will automatically mint tokens for you.

Once that has been done, the following scripts will run the demo script and issue AZTEC confidential transactions:

* ```npm run demoRinkeby```  
* ```npm run demoMainNet```
* ```npm run demoKovan```
* ```npm run demoRopsten```
* ```npm run demoDevelopment```

...you get the picture. The ```npm run demoDevelopment``` command expects a local blockchain network on port 8545 to be open. You can change the port number in ```config.js```.  

You can deploy your own AZTEC contracts (attached to different ERC20 token contracts if you want) by running ```truffle migrate```, specifying the appropriate network. See [the truffle docs](https://truffleframework.com/docs/truffle/getting-started/running-migrations) for more details.  

If you're running this script on a local test-net, run ```truffle migrate``` to deploy the AZTEC contracts locally.

## Usage

clone this repo to your desired directory

run ```git submodule update --init --recursive```  

followed by ```npm install``` and ```npm install ./aztec-crypto-js```