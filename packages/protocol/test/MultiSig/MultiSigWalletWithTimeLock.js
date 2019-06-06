/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, web3, it:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */

// ### Artifacts
const MultiSigWalletWithTimeLock = artifacts.require('./contracts/MultiSig/MultiSigWalletWithTimeLock');
const TestRejectEther = artifacts.require('./contracts/test/TestRejectEther');

// ### Time travel
const timetravel = require('../timeTravel');

// recreate tests for multisig
contract.only('MultiSigWalletWithTimeLock', (accounts) => {
    const owners = accounts.slice(0, 3);
    const nonOwner = accounts[3];
    const REQUIRED_APPROVALS = new BN(2);
    const SECONDS_TIME_LOCKED = new BN(1000000);

    describe('external_call', async () => {
        it('should be internal', async () => {
            const secondsTimeLocked = new BN(0);
            const multiSig = await MultiSigWalletWithTimeLock.new(
                owners,
                REQUIRED_APPROVALS,
                secondsTimeLocked,
                {
                    from: accounts[0],
                }
            );
            expect(multiSig.external_call === undefined).to.equal(true);
        });
    });

    describe('confirmTransaction', async () => {
        let multiSig;
        let txId;
        beforeEach(async () => {
            const secondsTimeLocked = new BN(0);
            multiSig = await MultiSigWalletWithTimeLock.new(
                owners,
                REQUIRED_APPROVALS,
                secondsTimeLocked,
                {
                    from: accounts[0],
                }
            );
            const txData = '0x';
            const tx = await multiSig.submitTransaction(nonOwner, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            txId = new BN(txLog.args.transactionId);
        });

        it('should revert if called by a non-owner', async () => {
            await truffleAssert.reverts(multiSig.confirmTransaction(txId, { from: nonOwner }));
        });

        it('should revert if transaction does not exist', async () => {
            const nonexistentTxId = new BN(123456789);
            await truffleAssert.reverts(multiSig.confirmTransaction(nonexistentTxId, { from: owners[1] }));
        });

        it('should revert if transaction is already confirmed by caller', async () => {
            await truffleAssert.reverts(multiSig.confirmTransaction(txId, { from: owners[0] }));
        });

        it('should confirm transaction for caller and log a Confirmation event', async () => {
            const tx = await multiSig.confirmTransaction(txId, { from: owners[1] });
            const log = tx.receipt.logs[0];
            expect(log.event).to.be.equal('Confirmation');
            expect(log.args.sender).to.be.equal(owners[1]);
            expect(log.args.transactionId.toNumber()).to.be.equal(txId.toNumber());
        });

        it('should revert if fully confirmed', async () => {
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            await truffleAssert.reverts(multiSig.confirmTransaction(txId, { from: owners[2] }), 'TX_FULLY_CONFIRMED');
        });

        it('should set the confirmation time of the transaction if it becomes fully confirmed', async () => {
            const tx = await multiSig.confirmTransaction(txId, { from: owners[1] });
            const log = tx.receipt.logs[1];
            const { timestamp } = await web3.eth.getBlock(log.blockNumber);
            expect(log.args.confirmationTime.toNumber()).to.be.equal(timestamp);
            expect(log.args.transactionId.toNumber()).to.be.equal(txId.toNumber());
        });
    });

    describe('executeTransaction', async () => {
        let multiSig;
        let txId;
        beforeEach(async () => {
            multiSig = await MultiSigWalletWithTimeLock.new(
                owners,
                REQUIRED_APPROVALS,
                SECONDS_TIME_LOCKED,
                {
                    from: accounts[0],
                }
            );
            const txData = '0x';
            const tx = await multiSig.submitTransaction(nonOwner, 0, txData, { from: owners[0] });
            const txLog = tx.logs[0];
            txId = new BN(txLog.args.transactionId);
        });

        it('should revert if transaction has not been fully confirmed', async () => {
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            await truffleAssert.reverts(multiSig.executeTransaction(txId, { from: owners[2] }), 'TX_NOT_FULLY_CONFIRMED');
        });

        it('should revert if time lock has not passed', async () => {
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            await truffleAssert.reverts(multiSig.executeTransaction(txId, { from: owners[2] }), 'TIME_LOCK_INCOMPLETE');
        });

        it('should execute a transaction and log an Execution event if successful and called by owner', async () => {
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            const tx = await multiSig.executeTransaction(txId, { from: owners[2] });
            const log = tx.receipt.logs[0];
            expect(log.event).to.be.equal('Execution');
            expect(log.args.transactionId.toNumber()).to.be.equal(txId.toNumber());
        });

        it('should execute a transaction and log an Execution event if successful and called by non-owner', async () => {
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            const tx = await multiSig.executeTransaction(txId, { from: nonOwner });
            const log = tx.receipt.logs[0];
            expect(log.event).to.be.equal('Execution');
            expect(log.args.transactionId.toNumber()).to.be.equal(txId.toNumber());
        });

        it('should revert if a required confirmation is revoked before executeTransaction is called', async () => {
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            await multiSig.revokeConfirmation(txId, { from: owners[0] });
            await truffleAssert.reverts(multiSig.executeTransaction(txId, { from: nonOwner }), 'TX_NOT_FULLY_CONFIRMED');
        });

        it('should revert if transaction has been executed', async () => {
            await multiSig.confirmTransaction(txId, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            await multiSig.executeTransaction(txId, { from: nonOwner });
            await truffleAssert.reverts(multiSig.executeTransaction(txId, { from: owners[0] }));
        });

        it('should log an ExecutionFailure event and not update the transaction\'s execution state if unsuccessful', async () => {
            const contractWithoutFallback = await TestRejectEther.new({ from: owners[0] });
            const submissionTx = await multiSig.submitTransaction(contractWithoutFallback.address, 10, '0x', { from: owners[0] });
            const submissionLog = submissionTx.logs[0];
            const newTxIndex = new BN(submissionLog.args.transactionId);

            await multiSig.confirmTransaction(newTxIndex, { from: owners[1] });
            await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
            const tx = await multiSig.executeTransaction(newTxIndex, { from: owners[0] });
            const log = tx.receipt.logs[0];
            expect(log.event).to.be.equal('ExecutionFailure');
            expect(log.args.transactionId.toNumber()).to.be.equal(newTxIndex.toNumber());
        });
    });

    describe('changeTimeLock', async () => {
        describe('initially non-time-locked', async () => {
            let multiSig;
            beforeEach(async () => {
                const secondsTimeLocked = new BN(0);
                multiSig = await MultiSigWalletWithTimeLock.new(
                    owners,
                    REQUIRED_APPROVALS,
                    secondsTimeLocked,
                    {
                        from: accounts[0],
                    }
                );
            });

            it('should throw when not called by wallet', async () => {
                await truffleAssert.reverts(multiSig.changeTimeLock(SECONDS_TIME_LOCKED, { from: owners[0] }));
            });

            it('should throw without enough confirmations', async () => {
                const txData = multiSig.contract.methods.changeTimeLock(SECONDS_TIME_LOCKED.toNumber()).encodeABI();
                const submissionTx = await multiSig.submitTransaction(multiSig.address, 0, txData, { from: accounts[0] });
                const submissionTxLog = submissionTx.logs[0];
                const submissionTxId = new BN(submissionTxLog.args.transactionId);
                await truffleAssert.reverts(multiSig.executeTransaction(submissionTxId, { from: accounts[0] }), 'TX_NOT_FULLY_CONFIRMED');
            });

            it('should set confirmation time with enough confirmations', async () => {
                const txData = multiSig.contract.methods.changeTimeLock(SECONDS_TIME_LOCKED.toNumber()).encodeABI();
                const submissionTx = await multiSig.submitTransaction(multiSig.address, 0, txData, { from: accounts[0] });
                const submissionTxLog = submissionTx.logs[0];
                const submissionTxId = new BN(submissionTxLog.args.transactionId);

                await multiSig.confirmTransaction(submissionTxId, { from: owners[1] });
                await multiSig.executeTransaction(submissionTxId, { from: owners[0] });
                const block = await web3.eth.getBlock('latest');
                const timestamp = block.timestamp;
                const transactionConfirmationTime = await multiSig.confirmationTimes(submissionTxId, { from: owners[0] });

                expect(timestamp).to.be.equal(transactionConfirmationTime.toNumber());
            });

            it('should be executable with enough confirmations and secondsTimeLocked of 0', async () => {
                const txData = multiSig.contract.methods.changeTimeLock(SECONDS_TIME_LOCKED.toNumber()).encodeABI();
                const submissionTx = await multiSig.submitTransaction(multiSig.address, 0, txData, { from: accounts[0] });
                const submissionTxLog = submissionTx.logs[0];
                const submissionTxId = new BN(submissionTxLog.args.transactionId);

                await multiSig.confirmTransaction(submissionTxId, { from: owners[1] });
                await multiSig.executeTransaction(submissionTxId, { from: owners[0] });
                const secondsTimeLocked = await multiSig.secondsTimeLocked(submissionTxId, { from: owners[0] });

                expect(secondsTimeLocked.toNumber()).to.be.equal(SECONDS_TIME_LOCKED.toNumber());
            });
        });

        describe('initially time-locked', async () => {
            let multiSig;
            const newSecondsTimeLocked = new BN(0);
            beforeEach(async () => {
                multiSig = await MultiSigWalletWithTimeLock.new(
                    owners,
                    REQUIRED_APPROVALS,
                    SECONDS_TIME_LOCKED,
                    {
                        from: accounts[0],
                    }
                );
            });

            it('should throw if it has enough confirmations but is not past the time lock', async () => {
                const txData = multiSig.contract.methods.changeTimeLock(newSecondsTimeLocked.toNumber()).encodeABI();
                const submissionTx = await multiSig.submitTransaction(multiSig.address, 0, txData, { from: accounts[0] });
                const submissionTxLog = submissionTx.logs[0];
                const submissionTxId = new BN(submissionTxLog.args.transactionId);
                await multiSig.confirmTransaction(submissionTxId, { from: owners[1] });
                await truffleAssert.reverts(multiSig.executeTransaction(submissionTxId, { from: accounts[0] }), 'TIME_LOCK_INCOMPLETE');
            });

            it('should execute if it has enough confirmations and is past the time lock', async () => {
                const txData = multiSig.contract.methods.changeTimeLock(newSecondsTimeLocked.toNumber()).encodeABI();
                const submissionTx = await multiSig.submitTransaction(multiSig.address, 0, txData, { from: accounts[0] });
                const submissionTxLog = submissionTx.logs[0];
                const submissionTxId = new BN(submissionTxLog.args.transactionId);
                await multiSig.confirmTransaction(submissionTxId, { from: owners[1] });
                await timetravel.advanceTimeAndBlock(SECONDS_TIME_LOCKED.toNumber());
                await multiSig.executeTransaction(submissionTxId, { from: accounts[0] });

                const secondsTimeLocked = await multiSig.secondsTimeLocked({ from: owners[0] });
                expect(secondsTimeLocked.toNumber()).to.be.equal(newSecondsTimeLocked.toNumber());
            });
        });
    });
});
