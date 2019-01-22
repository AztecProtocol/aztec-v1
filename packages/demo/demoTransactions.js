// ### external dependencies
const BN = require('bn.js');

// ### internal dependencies
const aztecBridgeContract = require('./resources/contracts/aztecToken');
const config = require('./config');
const erc20 = require('./resources/contracts/erc20Token');
const notes = require('./resources/notes');
const transactions = require('./resources/transactions');
const wallets = require('./resources/wallets');
const web3 = require('./web3Listener');
const keystore = require('./accounts');

const { erc20ScalingFactor: scalingFactor } = config;

/**
 * Runs a sequence of demonstration confidential transactions.  
 * We start with deployed AZTEC.sol,AZTECERC20Bridge.sol and ERC20.sol contracts.  
 * We create a set of confidential AZTEC notes, and then split and trade these notes amongst three wallets
 *
 * @method demoTransactions
 * @param { bool } mint set to true if you want this method call to mint tokens (used for test nets)
 * @private
 */
async function demoTransactions(mint = false) {
    const accounts = keystore.keys.map(({ address }) => address);

    await wallets.init(accounts[0]);
    await wallets.init(accounts[1]);
    await wallets.init(accounts[2]);

    if (config.env === 'DEVELOPMENT') {
        const testAccounts = await web3.eth.getAccounts();
        await Promise.all(accounts.map((account) => {
            return web3.eth.sendTransaction({
                from: testAccounts[0],
                to: account,
                value: web3.utils.toWei('0.5', 'ether'),
            });
        }));
    }
    const aztecBridgeContractAddress = await aztecBridgeContract.getContractAddress();
    // approve aztecBridgeContract for scalingFactor.mul(100) tokens from account 0
    // create 4 notes split between accounts 0, 1 and 2
    // split 1st and 3rd note
    // split 2nd and 4th note
    if (mint) {
        console.log('minting 100 tokens');
        await transactions.getTransactionReceipt(
            await erc20.mint(
                accounts[0],
                accounts[0],
                scalingFactor.mul(new BN(100)).toString(10)
            )
        );
        console.log('minted');
    }

    console.log('approving aztecBridgeContract to spend 100 tokens owned by accounts[0]');
    await transactions.getTransactionReceipt(
        await erc20.approve(
            accounts[0],
            aztecBridgeContractAddress,
            scalingFactor.mul(new BN(100)).toString(10)
        )
    );
    const proofs = [];
    const transactionHashes = [];
    console.log('issuing first join-split transaction');

    proofs[0] = await notes.createConfidentialTransfer(
        [],
        [[accounts[0], 22], [accounts[0], 20], [accounts[1], 22], [accounts[2], 36]],
        -100,
        accounts[0],
        aztecBridgeContractAddress
    );
    transactionHashes[0] = await aztecBridgeContract.confidentialTransfer(
        accounts[0],
        proofs[0].proofData,
        proofs[0].m,
        proofs[0].challenge,
        proofs[0].inputSignatures,
        proofs[0].outputOwners,
        proofs[0].metadata
    );
    console.log('dispatched 1st join-split, waiting for receipt');

    await aztecBridgeContract.updateConfidentialTransferTransaction(transactionHashes[0]);

    console.log('first join-split transaction mined, issuing second join-split transaction');

    proofs[1] = await notes.createConfidentialTransfer(
        [proofs[0].noteHashes[0], proofs[0].noteHashes[2]],
        [[accounts[0], 30], [accounts[2], 14]],
        0,
        accounts[0],
        aztecBridgeContractAddress
    );

    console.log('sending transaction');
    transactionHashes[1] = await aztecBridgeContract.confidentialTransfer(
        accounts[0],
        proofs[1].proofData,
        proofs[1].m,
        proofs[1].challenge,
        proofs[1].inputSignatures,
        proofs[1].outputOwners,
        proofs[1].metadata
    );

    console.log('dispatched 2nd join-split, waiting for receipt');

    await aztecBridgeContract.updateConfidentialTransferTransaction(transactionHashes[1]);

    console.log('second join-split transaction mined, issuing third join-split transaction');

    proofs[2] = await notes.createConfidentialTransfer(
        [proofs[0].noteHashes[1], proofs[0].noteHashes[3]],
        [[accounts[0], 25], [accounts[2], 25]],
        6,
        accounts[1],
        aztecBridgeContractAddress
    );
    transactionHashes[2] = await aztecBridgeContract.confidentialTransfer(
        accounts[1],
        proofs[2].proofData,
        proofs[2].m,
        proofs[2].challenge,
        proofs[2].inputSignatures,
        proofs[2].outputOwners,
        proofs[2].metadata
    );

    console.log('dispatched 3rd join-split, waiting for receipt');
    await aztecBridgeContract.updateConfidentialTransferTransaction(transactionHashes[2]);

    console.log('third join-split transaction mined');
}

if (config.env === 'MAINNET') {
    demoTransactions(false).then(() => {
        web3.currentProvider.connection.close();
        console.log('finished, ctrl+c to quit');
    });
} else if (config.env !== 'TEST') {
    demoTransactions(true).then(() => {
        web3.currentProvider.connection.close();
        console.log('finished, ctrl+c to quit');
    });
}
