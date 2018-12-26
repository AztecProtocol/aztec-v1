/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');
const DummyContract = artifacts.require('../contracts/DummyContract');
const Wnaf = artifacts.require('../contracts/Wnaf');
const WnafInterface = artifacts.require('../contrats/WnafInterface');

const referenceWnaf = require('../js_snippets/wnaf');

Wnaf.abi = WnafInterface.abi; // hon hon hon
DummyContract.abi = WnafInterface.abi;
contract.only('Wnaf', (accounts) => {
    let contract;
    let dummyContract;
    beforeEach(async () => {
        dummyContract = await DummyContract.new();
        contract = await Wnaf.new();
    });

    it('can succesfully calculate wnaf', async () => {
        let testVar = new BN(crypto.randomBytes(32), 16);
        let tx = await contract.calculateWnafPure(`0x${testVar.toString(16)}`, {
            from: accounts[0],
            gas: 50000
        });
        const result = tx.map(t => new BN(t.toString(16), 16)).filter(f => !f.eq(new BN('0', 10)));
        const reference = referenceWnaf(testVar);
        assert(result.length = reference.length);
        result.forEach((r, i) => {
            assert(r.eq(reference[i]));
        });
    });

    it('gas cost evaluation', async () => {
        // hacky way to guestimate how much gas calculating a wnaf costs
        // the dummy implementation has the same setup rigamarole
        // so the difference should be purely the cost of the algorithm
        const sample = 2;
        let gasCost = 0;
        for (let i = 0; i < sample; i += 1) {
            let testVar = new BN(crypto.randomBytes(32), 16);
            let mainTx = await contract.calculateWnaf(`0x${testVar.toString(16)}`, {
                from: accounts[0],
                gas: 50000
            });
            let dummyTx = await dummyContract.calculateWnaf(`0x${testVar.toString(16)}`, {
                from: accounts[0],
                gas: 500000
            });
            gasCost += (mainTx.receipt.cumulativeGasUsed - dummyTx.receipt.cumulativeGasUsed);
        }
        const averageGasDiff = gasCost / sample;

        // hmm, average gas cost = 4,400
        // ...I can live with that
        // I think it used to be ~8,600
    });
});
