/* global artifacts, expect, contract, beforeEach, it:true */
const { JoinSplitProof, signer } = require('aztec.js');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const bip39 = require('bip39');
const BN = require('bn.js');
const crypto = require('crypto');
const dotenv = require('dotenv');
const hdkey = require('ethereumjs-wallet/hdkey');
const truffleAssert = require('truffle-assertions');
const { keccak256, padLeft, soliditySha3 } = require('web3-utils');

const helpers = require('../helpers/ERC1724');
const timeTravel = require('../timeTravel');

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ZkAsset = artifacts.require('./ZkAsset');
const ZkAssetTest = artifacts.require('./ZkAssetTest');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;

dotenv.config();
const mnemonic = process.env.TEST_MNEMONIC;
const seed = bip39.mnemonicToSeed(mnemonic);
const hdwallet = hdkey.fromMasterSeed(seed);

const { customMetaData, revisedCustomMetaData } = helpers;

const computeDomainHash = (validatorAddress) => {
    const types = { EIP712Domain: constants.eip712.EIP712_DOMAIN };
    const domain = signer.generateZKAssetDomainParams(validatorAddress);
    return keccak256(`0x${typedData.encodeMessageData(types, 'EIP712Domain', domain)}`);
};

const randomAddress = () => {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
};

contract.only('ZkAsset', (accounts) => {
    let ace;
    let erc20;
    const publicOwner = accounts[0];
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);
    const sender = accounts[0];

    beforeEach(async () => {
        ace = await ACE.at(ACE.address);
        erc20 = await ERC20Mintable.new({ from: accounts[0] });

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

        it('should set the flags', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const registry = await ace.getRegistry(zkAsset.address);
            expect(registry.canAdjustSupply).to.equal(false);
            expect(registry.canConvert).to.equal(true);
        });

        it('should set canConvert flag to true if linked token address is provided', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const registry = await ace.getRegistry(zkAsset.address);

            expect(registry.canConvert).to.equal(true);
            expect(registry.canAdjustSupply).to.equal(false);
            const result = await zkAsset.linkedToken();
            expect(result).to.equal(erc20.address);
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
            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0],
            });
            expect(receipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());
        });

        it('should emit CreateNote() event with customMetaData when a single note is created', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositPublicValue,
                depositInputOwnerAccounts,
            } = await helpers.getDefaultDepositNotes();
            const publicValue = depositPublicValue * -1;
            const ephemeral = depositOutputNotes[0].metaData.slice(2);

            depositOutputNotes.forEach((individualNote) => {
                return individualNote.setMetaData(customMetaData.data);
            });

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const transferAmountBN = new BN(depositPublicValue);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            await ace.publicApprove(zkAsset.address, proof.hash, 200, { from: accounts[0] });
            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0],
            });
            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());

            // Crucial check, confirm that the event contains the expected metaData
            const event = receipt.logs.find((l) => l.event === 'CreateNote');

            const customDataLength = customMetaData.data.length;
            const emittedEphemeral = event.args.metadata.slice(130, 196);
            const emittedCustomData = event.args.metadata.slice(196, 196 + customDataLength);

            expect(emittedEphemeral).to.equal(ephemeral);
            expect(emittedCustomData).to.equal(customMetaData.data.slice(2));
        });

        it('should emit CreateNote() event with appropriate metadata for multiple notes', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 30;

            const aztecAccount = secp256k1.generateAccount(); // this is just an address. Need the publicKey
            const depositOutputNotes = await helpers.getNotesForAccount(aztecAccount, [20, 10]);
            const publicValue = depositPublicValue * -1;

            const customMetadataA = customMetaData.data;

            // changed the first digit of customMetaData
            const customMetadataB = '0x3' + customMetaData.data.slice(3);
            const customMetadataArray = [customMetadataA, customMetadataB];

            depositOutputNotes.forEach((individualNote, index) => {
                return individualNote.setMetaData(customMetadataArray[index]);
            });

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);

            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const transferAmountBN = new BN(depositPublicValue);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            await ace.publicApprove(zkAsset.address, proof.hash, 200, { from: accounts[0] });
            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0],
            });
            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());

            // Crucial check, confirm that the event contains the custom metadata
            const event = receipt.logs.filter((l) => l.event === 'CreateNote');
            const customDataLength = customMetaData.data.length;

            expect(event[0].args.metadata.slice(196, 196 + customDataLength)).to.equal(customMetadataA.slice(2)); // 1st note metadata
            expect(event[1].args.metadata.slice(196, 196 + customDataLength)).to.equal(customMetadataB.slice(2)); // 2nd note metadata
        });

        it('should update a note registry with proofs where a mixture of notes with set metadata have been used', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 20;

            const aztecAccount = secp256k1.generateAccount(); // this is just an address. Need the publicKey
            const depositOutputNotes = await helpers.getNotesForAccount(aztecAccount, [20]);
            const publicValue = depositPublicValue * -1;

            depositOutputNotes.forEach((individualNote) => {
                return individualNote.setMetaData(customMetaData.data);
            });

            const depositProof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);
            console.log({ depositSignatures });

            await ace.publicApprove(zkAsset.address, depositProof.hash, 20, { from: accounts[0] });
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });

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
            console.log({ withdrawSignatures });

            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](withdrawData, withdrawSignatures, {
                from: accounts[0],
            });
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
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });
            const withdrawalProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = withdrawalProof.encodeABI(zkAsset.address);
            const transferSignatures = withdrawalProof.constructSignatures(zkAsset.address, transferInputOwnerAccounts);
            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](transferData, transferSignatures, {
                from: accounts[0],
            });
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
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });

            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const transferData = transferProof.encodeABI(JoinSplitValidator.address);
            const transferSignatures = transferProof.constructSignatures(zkAsset.address, transferInputOwnerAccounts);
            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](transferData, transferSignatures, {
                from: accounts[0],
            });
            expect(receipt.status).to.equal(true);
        });

        it('should set the metaDataTimeLog', async () => {
            // create one outputNote, then place other addresses on the approved noteAccess mapping
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

            await ace.publicApprove(zkAsset.address, proof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, { from: accounts[0] });

            const { noteHash } = depositOutputNotes[0];
            const metaDataTimeLog = await zkAsset.metaDataTimeLog.call(noteHash);
            expect(metaDataTimeLog).to.not.equal(undefined);
        });

        it('should allow noteOwner to call updateNoteMetaData()', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 20;

            const noteOwnerWallet = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
            const noteOwnerAccount = secp256k1.accountFromPrivateKey(noteOwnerWallet.getPrivateKeyString());

            const depositOutputNotes = await helpers.getNotesForAccount(noteOwnerAccount, [20]);
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, proof.hash, 200, { from: accounts[0] });
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0],
            });

            const customDataLength = customMetaData.dataWithNewEphemeral.length;
            const { receipt: updateReceipt } = await zkAsset.updateNoteMetaData(
                depositOutputNotes[0].noteHash,
                customMetaData.dataWithNewEphemeral,
                {
                    from: noteOwnerAccount.address,
                },
            );

            const updateEvent = updateReceipt.logs.find((l) => l.event === 'UpdateNoteMetaData');
            const emittedUpdateMetaData = updateEvent.args.metadata.slice(0, customDataLength);
            expect(emittedUpdateMetaData).to.equal(customMetaData.dataWithNewEphemeral);
        });

        it('noteOwner should approve an address and enable approved address to call updateNoteMetaData()', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 20;

            const noteOwnerWallet = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
            const noteOwnerAccount = secp256k1.accountFromPrivateKey(noteOwnerWallet.getPrivateKeyString());

            const addressApprovedWallet = hdwallet.derivePath("m/44'/60'/0'/0/1").getWallet();
            const approvedAddressAccount = secp256k1.accountFromPrivateKey(addressApprovedWallet.getPrivateKeyString());

            const depositOutputNotes = await helpers.getNotesForAccount(noteOwnerAccount, [20]);
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, proof.hash, 200, { from: accounts[0] });
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0],
            });

            await zkAsset.updateNoteMetaData(depositOutputNotes[0].noteHash, customMetaData.dataWithNewEphemeral, {
                from: noteOwnerAccount.address,
            });

            // Call the updateNoteMetaData() function with an address that should have been approved
            const revisedCustomDataLength = revisedCustomMetaData.dataWithNewEphemeral.length;
            const { receipt: updateReceipt } = await zkAsset.updateNoteMetaData(
                depositOutputNotes[0].noteHash,
                revisedCustomMetaData.dataWithNewEphemeral,
                {
                    from: approvedAddressAccount.address,
                },
            );

            const updateEvent = updateReceipt.logs.find((l) => l.event === 'UpdateNoteMetaData');
            const emittedUpdateMetaData = updateEvent.args.metadata.slice(0, revisedCustomDataLength);
            expect(emittedUpdateMetaData).to.equal(revisedCustomMetaData.dataWithNewEphemeral);
        });

        it('should approve and grant addresses noteAccess', async () => {
            // create one outputNote, then place other addresses on the approved noteAccess mapping
            // zkAssetTest removes the explicit permission check - used to thoroughly test the
            // mapping which the permissioning check is based on
            const zkAssetTest = await ZkAssetTest.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositPublicValue,
                depositInputOwnerAccounts,
            } = await helpers.getDefaultDepositNotes();
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAssetTest.address);
            const signatures = proof.constructSignatures(zkAssetTest.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAssetTest.address, proof.hash, depositPublicValue, { from: accounts[0] });
            await zkAssetTest.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0],
            });

            const { noteHash } = depositOutputNotes[0];
            const originalMetaDataTimeLog = (await zkAssetTest.metaDataTimeLog.call(noteHash)).toNumber();

            // approving initial addresses located in customMetaData
            await zkAssetTest.updateNoteMetaData(noteHash, customMetaData.dataWithNewEphemeral, {
                from: accounts[0],
            });

            const approvedAddressIDs = customMetaData.addresses.map(
                (individualAddress) => soliditySha3(individualAddress, noteHash), // soliditySha3 acts the same as keccak256(abi.encodePacked()) in solidity
            );

            // extract the approved address status from ZkAsset `noteAccess` mapping
            const addressPermissionStatus = await Promise.all(
                new Array(customMetaData.addresses.length).fill(null).map((item, index) => {
                    return zkAssetTest.noteAccess.call(approvedAddressIDs[index]);
                }),
            );
            // (originalMetaDataTimeLog - 1) used to check greater than or equal to condition
            for (let i = 0; i < customMetaData.addresses.length; i += 1) {
                expect(addressPermissionStatus[i].toNumber()).to.be.greaterThan(originalMetaDataTimeLog - 1);
            }
        });

        it('should revoke noteAccess and grant to new set of addresses', async () => {
            const zkAssetTest = await ZkAssetTest.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositPublicValue,
                depositInputOwnerAccounts,
            } = await helpers.getDefaultDepositNotes();
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAssetTest.address);
            const signatures = proof.constructSignatures(zkAssetTest.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAssetTest.address, proof.hash, depositPublicValue, { from: accounts[0] });
            await zkAssetTest.methods['confidentialTransfer(bytes,bytes)'](data, signatures, { from: accounts[0] });

            const { noteHash } = depositOutputNotes[0];

            // approving initial addresses located in customMetaData
            await zkAssetTest.updateNoteMetaData(noteHash, customMetaData.dataWithNewEphemeral, {
                from: accounts[0],
            });

            const initialMetaDataTimeLog = (await zkAssetTest.metaDataTimeLog.call(noteHash)).toNumber();

            const initialApprovedAddressIDs = customMetaData.addresses.map((individualAddress) =>
                soliditySha3(individualAddress, noteHash),
            );

            // extract the approved address status from ZkAsset `noteAccess` mapping
            const initialAddressPermissionStatus = await Promise.all(
                new Array(customMetaData.addresses.length).fill(null).map((item, index) => {
                    return zkAssetTest.noteAccess.call(initialApprovedAddressIDs[index]);
                }),
            );

            await timeTravel.advanceTimeAndBlock(50);

            // approving new set of addresses
            await zkAssetTest.updateNoteMetaData(noteHash, revisedCustomMetaData.dataWithNewEphemeral, {
                from: accounts[0],
            });
            const newMetaDataTimeLog = (await zkAssetTest.metaDataTimeLog.call(noteHash)).toNumber();

            const revisedApprovedAddressIDs = revisedCustomMetaData.addresses.map((individualAddress) =>
                soliditySha3(individualAddress, noteHash),
            );

            // extract the revised approved address statuses
            const revisedAddressPermissionStatus = await Promise.all(
                new Array(revisedCustomMetaData.addresses.length).fill(null).map((item, index) => {
                    return zkAssetTest.noteAccess.call(revisedApprovedAddressIDs[index]);
                }),
            );

            // check that permission has been revoked for initialAddresses (i.e. < newMetaDataTimeLog)
            for (let i = 0; i < customMetaData.addresses.length; i += 1) {
                // (initialMetaDataTimeLog - 1) used to check greater than or equal to condition
                expect(initialAddressPermissionStatus[i].toNumber()).to.be.greaterThan(initialMetaDataTimeLog - 1);
                expect(initialAddressPermissionStatus[i].toNumber()).to.be.lessThan(newMetaDataTimeLog);
            }
            // check that permission has been granted for revisedAddresses
            for (let i = 0; i < revisedCustomMetaData.addresses.length; i += 1) {
                // (newMetaDataTimeLog - 1) used to check greater than or equal to condition
                expect(revisedAddressPermissionStatus[i].toNumber()).to.be.greaterThan(newMetaDataTimeLog - 1);
            }
        });

        it('should approve addresses in metaData immediately upon note creation', async () => {
            const zkAssetTest = await ZkAssetTest.new(ace.address, erc20.address, scalingFactor);
            const {
                depositInputNotes,
                depositOutputNotes,
                depositPublicValue,
                depositInputOwnerAccounts,
            } = await helpers.getDefaultDepositNotes();
            const publicValue = depositPublicValue * -1;

            depositOutputNotes.forEach((individualNote) => {
                return individualNote.setMetaData(customMetaData.data);
            });

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAssetTest.address);
            const signatures = proof.constructSignatures(zkAssetTest.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAssetTest.address, proof.hash, depositPublicValue, { from: accounts[0] });
            await zkAssetTest.methods['confidentialTransfer(bytes,bytes)'](data, signatures, { from: accounts[0] });

            const { noteHash } = depositOutputNotes[0];

            const initialMetaDataTimeLog = (await zkAssetTest.metaDataTimeLog.call(noteHash)).toNumber();

            const initialApprovedAddressIDs = customMetaData.addresses.map((individualAddress) =>
                soliditySha3(individualAddress, noteHash),
            );

            // extract the approved address status from ZkAsset `noteAccess` mapping
            const initialAddressPermissionStatus = await Promise.all(
                new Array(customMetaData.addresses.length).fill(null).map((item, index) => {
                    return zkAssetTest.noteAccess.call(initialApprovedAddressIDs[index]);
                }),
            );

            await timeTravel.advanceTimeAndBlock(50);

            // check that permission has been revoked for initialAddresses (i.e. < newMetaDataTimeLog)
            for (let i = 0; i < customMetaData.addresses.length; i += 1) {
                // (initialMetaDataTimeLog - 1) used to check greater than or equal to condition
                expect(initialAddressPermissionStatus[i].toNumber()).to.be.greaterThan(initialMetaDataTimeLog - 1);
            }
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
            await truffleAssert.reverts(zkAsset.methods['confidentialTransfer(bytes,bytes)'](malformedProofData, signatures));
        });

        it('should should fail to create zkAsset if 0x0 is linked token address', async () => {
            await truffleAssert.reverts(
                ZkAsset.new(ace.address, constants.addresses.ZERO_ADDRESS, scalingFactor),
                'can not create asset with convert and adjust flags set to false',
            );
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
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });

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

            await truffleAssert.reverts(zkAsset.methods['confidentialTransfer(bytes,bytes)'](transferData, zeroSignatures));
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
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });

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

            await truffleAssert.reverts(zkAsset.methods['confidentialTransfer(bytes,bytes)'](transferData, malformedSignatures));
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
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });

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

            await truffleAssert.reverts(
                zkAsset.methods['confidentialTransfer(bytes,bytes)'](transferData, malformedtransferSignatures),
            );
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
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });

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

            await truffleAssert.reverts(
                zkAsset.methods['confidentialTransfer(bytes,bytes)'](transferData, malformedtransferSignatures),
            );
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
            const depositSignatures = depositProof.constructSignatures(JoinSplitValidator.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, { from: accounts[0] });

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

            await truffleAssert.reverts(
                zkAsset.methods['confidentialTransfer(bytes,bytes)'](transferData, malformedtransferSignatures),
            );
        });

        it('should fail to update note metaData if msg.sender !== noteOwner or on approved noteAccess mapping', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositPublicValue = 20;

            const aztecAccount = secp256k1.generateAccount();
            const depositOutputNotes = await helpers.getNotesForAccount(aztecAccount, [20]);
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, proof.hash, 200, { from: accounts[0] });
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0], // accounts[0] is not noteOwner here, so will fail
            });

            await truffleAssert.reverts(
                zkAsset.updateNoteMetaData(depositOutputNotes[0].noteHash, customMetaData.dataWithNewEphemeral, {
                    from: accounts[0],
                }),
            );
        });
    });
});
