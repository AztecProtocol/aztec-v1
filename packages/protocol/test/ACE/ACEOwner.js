/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, it:true */
// ### External Dependencies
const bn128 = require('@aztec/bn128');
const {
    proofs: { JOIN_SPLIT_PROOF, BOGUS_PROOF },
} = require('@aztec/dev-utils');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

/* eslint-disable-next-line object-curly-newline */

// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const ACEOwner = artifacts.require('./contracts/ACE/ACEOwner');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');

// ### Time travel
const timetravel = require('../timeTravel');

JoinSplit.abi = JoinSplitInterface.abi;

contract('ACEOwner', (accounts) => {
    const owners = accounts.slice(0, 3);
    const nonOwner = accounts[3];
    const REQUIRED_APPROVALS = new BN(2);
    const SECONDS_TIME_LOCKED = new BN(1000000);

    describe('initialization', () => {
        const secondsTimeLocked = new BN(0);

        it('should create an ACE with ACEOwner as owner', async () => {
            const aceOwner = await ACEOwner.new(owners, REQUIRED_APPROVALS, secondsTimeLocked, {
                from: owners[0],
            });
            const aceAddress = await aceOwner.ace();
            const ace = await ACE.at(aceAddress);

            const owner = await ace.owner();
            expect(owner).to.equal(aceOwner.address);
        });
    });

    describe('initially non-time-locked', () => {
        const secondsTimeLocked = new BN(0);

        it('should set the common reference string through ACEOwner', async () => {
            const aceOwner = await ACEOwner.new(owners, REQUIRED_APPROVALS, secondsTimeLocked, {
                from: owners[0],
            });
            const aceAddress = await aceOwner.ace();
            const ace = await ACE.at(aceAddress);

            const txData = ace.contract.methods.setCommonReferenceString(bn128.CRS).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: owners[1] });
            await aceOwner.executeTransaction(txId, { from: owners[0] });

            const result = await ace.getCommonReferenceString();
            expect(result).to.deep.equal(bn128.CRS);
        });

        it('should set a proof through ACEOwner', async () => {
            const aceOwner = await ACEOwner.new(owners, REQUIRED_APPROVALS, secondsTimeLocked, {
                from: owners[0],
            });
            const aceAddress = await aceOwner.ace();
            const ace = await ACE.at(aceAddress);

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
        it('should invalidate a proof through ACEOwner independent of timelock', async () => {
            const aceOwner = await ACEOwner.new(owners, REQUIRED_APPROVALS, SECONDS_TIME_LOCKED, {
                from: owners[0],
            });
            const aceAddress = await aceOwner.ace();
            const ace = await ACE.at(aceAddress);

            const aztecJoinSplit = await JoinSplit.new();
            const txData = await ace.contract.methods.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            await aceOwner.executeTransaction(txId, { from: owners[0] });

            const txDataInvalidateProof = await ace.contract.methods.invalidateProof(JOIN_SPLIT_PROOF).encodeABI();
            const txInvalidaProof = await aceOwner.submitTransaction(ace.address, 0, txDataInvalidateProof, {
                from: accounts[0],
            });
            const txLogInvalidateProof = txInvalidaProof.logs[0];
            const txIdInvalidateProof = new BN(txLogInvalidateProof.args.transactionId);
            await aceOwner.confirmTransaction(txIdInvalidateProof, { from: accounts[1] });
            await aceOwner.emergencyExecuteInvalidateProof(txIdInvalidateProof, { from: accounts[0] });
            await truffleAssert.reverts(
                ace.getValidatorAddress(JOIN_SPLIT_PROOF),
                'expected the validator address to not be disabled',
            );
        });

        it('should not execute any other tx through emergencyExecuteInvalidateProof', async () => {
            const aceOwner = await ACEOwner.new(owners, REQUIRED_APPROVALS, SECONDS_TIME_LOCKED, {
                from: owners[0],
            });
            const aceAddress = await aceOwner.ace();
            const ace = await ACE.at(aceAddress);

            const aztecJoinSplit = await JoinSplit.new();
            const txData = await ace.contract.methods.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            await aceOwner.executeTransaction(txId, { from: owners[0] });

            const txDataSetBogusProof = await ace.contract.methods.setProof(BOGUS_PROOF, nonOwner).encodeABI();
            const txSetBogusProof = await aceOwner.submitTransaction(ace.address, 0, txDataSetBogusProof, { from: accounts[0] });
            const txLogSetBogusProof = txSetBogusProof.logs[0];
            const txIdSetBogusProof = new BN(txLogSetBogusProof.args.transactionId);
            await aceOwner.confirmTransaction(txIdSetBogusProof, { from: accounts[1] });
            await truffleAssert.reverts(aceOwner.emergencyExecuteInvalidateProof(txIdSetBogusProof, { from: accounts[0] }));
        });
    });
});
