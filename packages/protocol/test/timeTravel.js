/* global web3 */

async function advanceTime(time) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [time],
            id: new Date().getTime(),
        }, (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
        });
    });
}

async function advanceBlock() {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: new Date().getTime(),
        }, (err) => {
            if (err) { return reject(err); }
            const newBlockHash = web3.eth.getBlock('latest').hash;

            return resolve(newBlockHash);
        });
    });
}

async function advanceTimeAndBlock(time) {
    await advanceTime(time);
    await advanceBlock();

    return web3.eth.getBlock('latest');
}

module.exports = {
    advanceTime,
    advanceBlock,
    advanceTimeAndBlock,
};
