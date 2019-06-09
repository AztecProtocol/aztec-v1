/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { constants, proofs: { JOIN_SPLIT_PROOF, BOGUS_PROOF } } = require('@aztec/dev-utils');


// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const ACEOwner = artifacts.require('./contracts/ACE/ACEOwner');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupplyInterface');

// ### Time travel
const timetravel = require('../timeTravel');

JoinSplit.abi = JoinSplitInterface.abi;
AdjustSupply.abi = AdjustSupplyInterface.abi;

contract('ACEOwner', (accounts) => {
    const owners = accounts.slice(0, 3);
    const nonOwner = accounts[3];
    const REQUIRED_APPROVALS = new BN(2);
    const SECONDS_TIME_LOCKED = new BN(1000000);

    describe('initialization', () => {
        const secondsTimeLocked = new BN(0);
        let ace;
        let aceOwner;

        beforeEach(async () => {
            aceOwner = await ACEOwner.new(
                owners,
                REQUIRED_APPROVALS,
                secondsTimeLocked,
                {
                    from: owners[0],
                }
            );
            const aceAddres = await aceOwner.ace();
            ace = await ACE.at(aceAddres);
        });

        it('should create an ACE with ACEOwner as owner', async () => {
            const owner = await ace.owner();
            expect(owner).to.equal(aceOwner.address);
        });
    });

    describe('initially non-time-locked', () => {
        const secondsTimeLocked = new BN(0);
        let ace;
        let aceOwner;

        beforeEach(async () => {
            aceOwner = await ACEOwner.new(
                owners,
                REQUIRED_APPROVALS,
                secondsTimeLocked,
                {
                    from: owners[0],
                }
            );
            const aceAddres = await aceOwner.ace();
            ace = await ACE.at(aceAddres);
        });

        it('should set the common reference string through ACEOwner', async () => {
            const txData = ace.contract.methods.setCommonReferenceString(constants.CRS).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: owners[1] });
            await aceOwner.executeTransaction(txId, { from: owners[0] });

            const result = await ace.getCommonReferenceString();
            expect(result).to.deep.equal(constants.CRS);
        });

        it('should set a proof through ACEOwner', async () => {
            const aztecJoinSplit = await JoinSplit.new();
            const txData = await ace.contract.methods.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: owners[1] });
            await aceOwner.executeTransaction(txId, { from: owners[0] });
            const resultValidatorAddress = await ace.getValidatorAddress(JOIN_SPLIT_PROOF);
            expect(resultValidatorAddress).to.equal(aztecJoinSplit.address);
        });
    });

    describe('initially time-locked', () => {
        let ace;
        let aceOwner;

        beforeEach(async () => {
            aceOwner = await ACEOwner.new(
                owners,
                REQUIRED_APPROVALS,
                SECONDS_TIME_LOCKED,
                {
                    from: owners[0],
                }
            );
            const aceAddres = await aceOwner.ace();
            ace = await ACE.at(aceAddres);
            const aztecJoinSplit = await JoinSplit.new();
            const txData = await ace.contract.methods.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            await aceOwner.executeTransaction(txId, { from: owners[0] });
        });

        it('should invalidate a proof through ACEOwner independent of timelock', async () => {
            const txData = await ace.contract.methods.invalidateProof(JOIN_SPLIT_PROOF).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: accounts[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: accounts[1] });
            await aceOwner.emergencyExecuteInvalidateProof(txId, { from: accounts[0] });
            await truffleAssert.reverts(ace.getValidatorAddress(JOIN_SPLIT_PROOF),
                'expected the validator address to not be disabled');
        });

        it('should not execute any other tx through emergencyExecuteInvalidateProof', async () => {
            const txData = await ace.contract.methods.setProof(BOGUS_PROOF, nonOwner).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: accounts[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: accounts[1] });
            await truffleAssert.reverts(aceOwner.emergencyExecuteInvalidateProof(txId, { from: accounts[0] }));
        });
    });
});
