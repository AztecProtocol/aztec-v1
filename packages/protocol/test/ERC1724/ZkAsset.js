/* global artifacts, expect, contract, beforeEach, it:true */
const { JoinSplitProof, metaData, signer } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const BN = require('bn.js');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { keccak256, padLeft, randomHex } = require('web3-utils');

const helpers = require('../helpers/ERC1724');

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ZkAsset = artifacts.require('./ZkAsset');
const ZkAssetTest = artifacts.require('./ZkAssetTest');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;

let joinSplitValidator;

const computeDomainHash = (validatorAddress) => {
    const types = { EIP712Domain: constants.eip712.EIP712_DOMAIN };
    const domain = signer.generateZKAssetDomainParams(validatorAddress);
    return keccak256(`0x${typedData.encodeMessageData(types, 'EIP712Domain', domain)}`);
};

const randomAddress = () => {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
};

contract('ZkAsset', (accounts) => {
    let ace;
    let erc20;
    const sender = accounts[0];
    const publicOwner = accounts[0];
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);

    beforeEach(async () => {
        ace = await ACE.new({ from: accounts[0] });
        erc20 = await ERC20Mintable.new({ from: accounts[0] });
        joinSplitValidator = await JoinSplitValidator.new({ from: sender });

        await ace.setCommonReferenceString(bn128.CRS);
        await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);

        await Promise.all(
            accounts.map((account) => {
                const opts = { from: accounts[0], gas: 4700000 };
                return erc20.mint(account, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
        await Promise.all(
            accounts.map((account) => {
                const opts = { from: account, gas: 4700000 };
                return erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
    });

    describe('Success States', async () => {
        it('should compute the correct domain hash', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const domainHash = computeDomainHash(zkAsset.address);
            const result = await zkAsset.EIP712_DOMAIN_HASH();
            expect(result).to.equal(domainHash);
        });

        it('should set the linked token', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const result = await zkAsset.linkedToken();
            expect(result).to.equal(erc20.address);
        });

        it('should set canConvert flag to false if 0x0 is linked token address', async () => {
            const nonConvertibleZkAsset = await ZkAsset.new(ace.address, constants.addresses.ZERO_ADDRESS, scalingFactor);

            const registry = await ace.getRegistry(nonConvertibleZkAsset.address);

            expect(registry.canConvert).to.equal(false);
            expect(registry.canAdjustSupply).to.equal(false);
            const result = await nonConvertibleZkAsset.linkedToken();
            expect(result).to.equal(constants.addresses.ZERO_ADDRESS);
        });

        it('should set canConvert flag to true if linked token address is provided', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const registry = await ace.getRegistry(zkAsset.address);

            expect(registry.canConvert).to.equal(true);
            expect(registry.canAdjustSupply).to.equal(false);
            const result = await zkAsset.linkedToken();
            expect(result).to.equal(erc20.address);
        });

        it('should set the scaling factor', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const result = await zkAsset.scalingFactor();
            expect(result.toNumber()).to.equal(scalingFactor.toNumber());
        });

        it('should update a note registry with output notes', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositPublicValue,
                depositInputOwnerAccounts,
            } = await helpers.getDefaultDepositNotes();
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const transferAmountBN = new BN(depositPublicValue);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            await ace.publicApprove(zkAsset.address, proof.hash, depositPublicValue, { from: accounts[0] });
            const { receipt } = await zkAsset.confidentialTransfer(data, signatures, { from: accounts[0] });
            expect(receipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());
        });

        it('should emit CreateNote() event with customMetadata when a single note is created', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositPublicValue,
                depositInputOwnerAccounts,
            } = await helpers.getDefaultDepositNotes();
            const publicValue = depositPublicValue * -1;

            const customMetadata =
                '00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';
            depositOutputNotes.forEach((individualNote) => {
                return individualNote.setMetadata(customMetadata);
            });

            const metadata = metaData.extractNoteMetadata(depositOutputNotes);
            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner, metadata);

            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const transferAmountBN = new BN(depositPublicValue);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            await ace.publicApprove(zkAsset.address, proof.hash, 200, { from: accounts[0] });
            const { receipt } = await zkAsset.confidentialTransfer(data, signatures, { from: accounts[0] });
            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());

            // Crucial check, confirm that the event contains the custom metadata
            const event = receipt.logs.find((l) => l.event === 'CreateNote');

            // check customMetadata is correct
            expect(event.args.metadata.slice(196, 752)).to.equal(customMetadata);
        });

        it('should update the metadata of a note when ZkAsset.updateNoteMetadData() called', async () => {
            /**
             * Using ZkAssetTest as the ZkAsset here. ZkAssetTest has the safety feature
             * require(noteOwner === msg.sender) removed. This is because it would not be possible to satisfy
             * this condition and also create the note in question with a truffle account (they do not expose
             * privateKeys or publicKeys).
             *
             * Failure test added for require(noteOwner === msg.sender) for a ZkAsset contract
             */
            const zkAssetTest = await ZkAssetTest.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 20;

            const aztecAccount = secp256k1.generateAccount(); // this is just an address. Need the publicKey
            const depositOutputNotes = await helpers.getNotesForAccount(aztecAccount, [20]);
            const publicValue = depositPublicValue * -1;

            const customMetadata =
                '00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';
            depositOutputNotes.forEach((individualNote) => {
                return individualNote.setMetadata(customMetadata);
            });

            const metadata = metaData.extractNoteMetadata(depositOutputNotes);
            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner, metadata);
            const data = proof.encodeABI(zkAssetTest.address);
            const signatures = proof.constructSignatures(zkAssetTest.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAssetTest.address, proof.hash, 200, { from: accounts[0] });
            const tx1 = await zkAssetTest.confidentialTransfer(data, signatures, { from: accounts[0] });

            const dummyEphemeralKeys = randomHex(192);
            const updatedMetaData =
                dummyEphemeralKeys +
                '00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';
            const tx2 = await zkAssetTest.updateNoteMetaData(depositOutputNotes[0].noteHash, updatedMetaData, {
                from: accounts[0],
            });

            // check original note created has expected metadata
            truffleAssert.eventEmitted(tx1, 'CreateNote', (event) => {
                return event.metadata.slice(196, 752) === customMetadata;
            });

            // check updateNoteMetaData() has updated the note metadata
            truffleAssert.eventEmitted(tx2, 'UpdateNoteMetadata', (event) => {
                return event.metadata === updatedMetaData;
            });
        });

        it('should emit CreateNote() event with appropriate metadata for multiple notes', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 30;

            const aztecAccount = secp256k1.generateAccount(); // this is just an address. Need the publicKey
            const depositOutputNotes = await helpers.getNotesForAccount(aztecAccount, [20, 10]);
            const publicValue = depositPublicValue * -1;

            const customMetadataA =
                '00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';

            // changed the first non-zero digit from 2 to 3
            const customMetadataB =
                '00000000000000000000000000000038000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';

            const customMetadata = [customMetadataA, customMetadataB];

            depositOutputNotes.forEach((individualNote, index) => {
                return individualNote.setMetadata(customMetadata[index]);
            });

            const metadata = metaData.extractNoteMetadata(depositOutputNotes);
            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner, metadata);

            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const transferAmountBN = new BN(depositPublicValue);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            await ace.publicApprove(zkAsset.address, proof.hash, 200, { from: accounts[0] });
            const { receipt } = await zkAsset.confidentialTransfer(data, signatures, { from: accounts[0] });
            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());

            // Crucial check, confirm that the event contains the custom metadata
            const event = receipt.logs.filter((l) => l.event === 'CreateNote');
            expect(event[0].args.metadata.slice(196, 752)).to.equal(customMetadataA); // 1st note metadata
            expect(event[1].args.metadata.slice(196, 752)).to.equal(customMetadataB); // 2nd note metadata
        });

        it('should update a note registry with proofs where a mixture of notes with set metadata have been used', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 20;

            const aztecAccount = secp256k1.generateAccount(); // this is just an address. Need the publicKey
            const depositOutputNotes = await helpers.getNotesForAccount(aztecAccount, [20]);
            const publicValue = depositPublicValue * -1;

            const customMetadata =
                '00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';
            depositOutputNotes.forEach((individualNote) => {
                return individualNote.setMetadata(customMetadata);
            });

            const metadata = metaData.extractNoteMetadata(depositOutputNotes);
            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                publicValue,
                publicOwner,
                metadata,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, 20, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures, { from: accounts[0] });

            const transferInputNotes = depositOutputNotes;
            const transferInputOwnerAccounts = [aztecAccount];
            const transferOutputNotes = await await helpers.getNotesForAccount(aztecAccount, [10]);
            const withdrawPublicValue = 10;

            const withdrawProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawPublicValue,
                publicOwner,
            );
            const withdrawData = withdrawProof.encodeABI(zkAsset.address);
            const withdrawSignatures = withdrawProof.constructSignatures(zkAsset.address, transferInputOwnerAccounts);

            const { receipt } = await zkAsset.confidentialTransfer(withdrawData, withdrawSignatures, { from: accounts[0] });
            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry by consuming input notes, with kPublic negative', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                transferInputOwnerAccounts,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const withdrawalProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = withdrawalProof.encodeABI(zkAsset.address);
            const transferSignatures = withdrawalProof.constructSignatures(zkAsset.address, transferInputOwnerAccounts);

            const { receipt } = await zkAsset.confidentialTransfer(transferData, transferSignatures);
            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry with kPublic = 0', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);

            // no deposit input notes
            // deposit proof output notes are used as input notes to the transfer proof
            const depositOutputNoteValues = [5, 25];
            const transferOutputNoteValues = [17, 13];
            const depositPublicValue = -30;
            const withdrawalPublicValue = 0;

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                transferInputOwnerAccounts,
            } = await helpers.getDepositAndTransferNotes(depositOutputNoteValues, transferOutputNoteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);
            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(joinSplitValidator.address);
            const transferSignatures = transferProof.constructSignatures(zkAsset.address, transferInputOwnerAccounts);
            const { receipt } = await zkAsset.confidentialTransfer(transferData, transferSignatures);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('Failure States', async () => {
        it('should fail if the ace fails to validate the proof', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositPublicValue,
                depositInputOwnerAccounts,
            } = await helpers.getDefaultDepositNotes();
            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const data = depositProof.encodeABI(zkAsset.address);
            const signatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            const malformedProofData = `0x0123${data.slice(6)}`;
            // no error message because it throws in assembly
            await truffleAssert.reverts(zkAsset.confidentialTransfer(malformedProofData, signatures));
        });

        it('should fail if signatures are zero', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const withdrawalProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = withdrawalProof.encodeABI(zkAsset.address);

            const length = 64;
            const zeroSignature = new Array(length).fill(0).join('');
            const zeroSignatures = `0x${zeroSignature + zeroSignature + zeroSignature}`;

            await truffleAssert.reverts(zkAsset.confidentialTransfer(transferData, zeroSignatures));
        });

        it('should fail if malformed signatures are provided', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const withdrawalProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = withdrawalProof.encodeABI(zkAsset.address);

            const malformedSignature = padLeft(crypto.randomBytes(32).toString('hex'));
            const malformedSignatures = `0x${malformedSignature + malformedSignature + malformedSignature}`;

            await truffleAssert.reverts(zkAsset.confidentialTransfer(transferData, malformedSignatures));
        });

        it('should fail if different note owner signs the transaction', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const malformedInputNoteOwners = [secp256k1.generateAccount(), secp256k1.generateAccount()];

            const withdrawalProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = withdrawalProof.encodeABI(zkAsset.address);
            const malformedtransferSignatures = withdrawalProof.constructSignatures(zkAsset.address, malformedInputNoteOwners);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(transferData, malformedtransferSignatures));
        });

        it('should fail if validator address is malformed', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const randomValidatorAddress = randomAddress();
            const depositSignatures = depositProof.constructSignatures(randomValidatorAddress, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const malformedInputNoteOwners = [secp256k1.generateAccount(), secp256k1.generateAccount()];

            const withdrawalProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = withdrawalProof.encodeABI(zkAsset.address);
            const malformedtransferSignatures = withdrawalProof.constructSignatures(zkAsset.address, malformedInputNoteOwners);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(transferData, malformedtransferSignatures));
        });

        it('should fail if validator address is the joinSplit address', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                transferInputNotes,
                transferOutputNotes,
                depositPublicValue,
                withdrawalPublicValue,
            } = await helpers.getDefaultDepositAndTransferNotes();

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(joinSplitValidator.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const malformedInputNoteOwners = [secp256k1.generateAccount(), secp256k1.generateAccount()];

            const withdrawalProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = withdrawalProof.encodeABI(zkAsset.address);
            const malformedtransferSignatures = withdrawalProof.constructSignatures(zkAsset.address, malformedInputNoteOwners);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(transferData, malformedtransferSignatures));
        });
    });
});
