/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { constants, proofs: { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');


// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const ACEOwner = artifacts.require('./contracts/ACE/ACEOwner');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupplyInterface');

JoinSplit.abi = JoinSplitInterface.abi;
AdjustSupply.abi = AdjustSupplyInterface.abi;

contract('ACEOwner', (accounts) => {
    describe('initialization', () => {
        let ace;
        let aceOwner;

        beforeEach(async () => {
            aceOwner = await ACEOwner.new(
                accounts.slice(0, 3),
                2,
                0,
                {
                    from: accounts[0],
                }
            );
            const aceAddres = await aceOwner.ace();
            ace = await ACE.at(aceAddres);
        });

        it('should create an ACE with ACEOwner as owner', async () => {
            const owner = await ace.owner();
            expect(owner).to.equal(aceOwner.address);
        });

        it('should set the common reference string through ACEOwner', async () => {
            const txData = ace.contract.methods.setCommonReferenceString(constants.CRS).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: accounts[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: accounts[1] });
            await aceOwner.executeTransaction(txId, { from: accounts[0] });

            const result = await ace.getCommonReferenceString();
            expect(result).to.deep.equal(constants.CRS);
        });

        it('should set a proof through ACEOwner', async () => {
            const aztecJoinSplit = await JoinSplit.new();
            const txData = await ace.contract.methods.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address).encodeABI();
            const tx = await aceOwner.submitTransaction(ace.address, 0, txData, { from: accounts[0] });
            const txLog = tx.logs[0];
            const txId = new BN(txLog.args.transactionId);
            await aceOwner.confirmTransaction(txId, { from: accounts[1] });
            await aceOwner.executeTransaction(txId, { from: accounts[0] });
            const resultValidatorAddress = await ace.getValidatorAddress(JOIN_SPLIT_PROOF);
            expect(resultValidatorAddress).to.equal(aztecJoinSplit.address);
        });
    });
});
