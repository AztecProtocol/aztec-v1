/* eslint-disable no-await-in-loop */
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

/** 
 * We're using the 0xorg/devnet Docker image, so Truffle
 * accounts are not by default preloaded with Ether.
 * 
 * @url https://github.com/0xProject/0x-monorepo/tree/development/packages/devnet
 */
const main = async () => {
    // the first account is the "sealer"
    const devnetAccounts = [
        '0xe8816898d851d5b61b7f950627d04d794c07ca37',
    ];
    const accounts = await web3.eth.getAccounts();
    for (let i = 0; i < accounts.length; i += 1) {
        await web3.eth.sendTransaction({
            from: devnetAccounts[0],
            to: accounts[i],
            value: '5000000000000000000', // 5 ether
        });
    }
};

main();
