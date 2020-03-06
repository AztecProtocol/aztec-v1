/* globals contract, artifacts, expect */

const {
    JoinSplitProof,
    signer,
} = require('aztec.js');
const { proofs } =require('@aztec/dev-utils');
const truffleAssert = require('truffle-assertions');
const { randomHex } = require('web3-utils');

const ACE = artifacts.require('./ACE');
const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const Behaviour20200220 = artifacts.require('./Behaviour20200220');
const Behaviour20200305 = artifacts.require('./Behaviour20200305');
const ERC20Mintable = artifacts.require('ERC20Mintable');
const ZkAsset = artifacts.require('ZkAssetOwnable');
const {
    generateOutputNotes,
    generateDepositProofInputs,
    getOwnerPrivateKey,
} = require('../../../helpers/AccountRegistry/epochs/20200106/Behaviour20200106');

contract.only('Behaviour20200305', async (accounts) => {
    const [userAddress,, senderAddress] = accounts;
    let behaviour20200305;
    let manager;
    let proxyContract;
    let erc20;
    let ace;
    let zkAsset;
    let proxyAddress;
    // Signature params
    const opts = { from: accounts[0] };
    const updatedGSNSignerAddress = '0x5323B6bbD3421983323b3f4f0B11c2D6D3bCE1d8';
    const initialAmount = 100;

    beforeEach(async () => {
        ace = await ACE.deployed();
        erc20 = await ERC20Mintable.new({ from: senderAddress });
        await erc20.mint(userAddress, initialAmount, { from: senderAddress });
        zkAsset = await ZkAsset.new(ace.address, erc20.address, 1, {
            from: accounts[2],
        });

        const behaviour20200220 = await Behaviour20200220.new();
        const initialBehaviourAddress = behaviour20200220.address;
        const initialGSNSignerAddress = randomHex(20);
        manager = await AccountRegistryManager.new(initialBehaviourAddress, ace.address, initialGSNSignerAddress, opts);

        // perform behaviour upgrade
        behaviour20200305 = await Behaviour20200305.new();
        await manager.upgradeAccountRegistry(behaviour20200305.address);
        proxyAddress = await manager.proxyAddress();
        proxyContract = await Behaviour20200305.at(proxyAddress);

        // set the GSN signer
        await proxyContract.setGSNSigner();
    });

    describe('Initialisation', async () => {
        it('should have set the GSN signer address', async () => {
            const updatedGSNSigner = await proxyContract.GSNSigner();
            expect(updatedGSNSigner.toString()).to.equal(updatedGSNSignerAddress);
        });

        it('should deploy DAI contract', async () => {
            expect(erc20.address).to.not.equal(undefined);
        });
    });

    describe('Success states', async () => {
        it('should call confidential approve twice if a second signature is passed in', async () => {

            const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();
            const publicOwner = proxyAddress;

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, proxyAddress, publicValue, publicOwner);
            await erc20.approve(proxyAddress, depositAmount, { from: userAddress });

            const depositProofData = depositProof.encodeABI(zkAsset.address);
            const depositProofHash = depositProof.hash;
            await proxyContract.deposit(zkAsset.address, userAddress, depositProofHash, depositProofData, depositAmount, {
                from: userAddress,
            });

            // Use created output notes in a confidentialTransferFrom() call
            const delegatedAddress = proxyAddress;
            const transferInputNotes = outputNotes;
            const transferOutputNotes = await generateOutputNotes([25, 25]);
            const transferPublicValue = 0;
            const transferPublicOwner = publicOwner;

            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                delegatedAddress,
                transferPublicValue,
                transferPublicOwner,
            );
            const transferProofData = transferProof.encodeABI(zkAsset.address);
            const delegatedAddressPrivateKey = getOwnerPrivateKey();

            const proofSignature = signer.signApprovalForProof(
                zkAsset.address,
                transferProof.eth.outputs,
                delegatedAddress,
                true,
                delegatedAddressPrivateKey,
            );
            const proofSignature2 = signer.makeReplaySignature(proofSignature);

            const { receipt } = await proxyContract.confidentialTransferFrom(
                proofs.JOIN_SPLIT_PROOF,
                zkAsset.address,
                transferProofData,
                delegatedAddress,
                proofSignature,
                proofSignature2,
            );
            expect(receipt.status).to.equal(true);

            await Promise.all(
                transferOutputNotes.map(async (individualNote) => {
                    const { status, noteOwner } = await ace.getNote(zkAsset.address, individualNote.noteHash);
                    expect(status.toNumber()).to.equal(1);
                    expect(noteOwner).to.equal(userAddress);
                }),
            );

            await truffleAssert.reverts(
                zkAsset.approveProof(proofs.JOIN_SPLIT_PROOF, transferProofData, delegatedAddress, true, proofSignature2),
                'signature has already been used'
            );
        });

    });
    it('should still be able to transfer if one signature is passed', async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();
        const publicOwner = proxyAddress;

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, proxyAddress, publicValue, publicOwner);
        await erc20.approve(proxyAddress, depositAmount, { from: userAddress });

        const depositProofData = depositProof.encodeABI(zkAsset.address);
        const depositProofHash = depositProof.hash;
        await proxyContract.deposit(zkAsset.address, userAddress, depositProofHash, depositProofData, depositAmount, {
            from: userAddress,
        });

        // Use created output notes in a confidentialTransferFrom() call
        const delegatedAddress = proxyAddress;
        const transferInputNotes = outputNotes;
        const transferOutputNotes = await generateOutputNotes([25, 25]);
        const transferPublicValue = 0;
        const transferPublicOwner = publicOwner;

        const transferProof = new JoinSplitProof(
            transferInputNotes,
            transferOutputNotes,
            delegatedAddress,
            transferPublicValue,
            transferPublicOwner,
        );
        const transferProofData = transferProof.encodeABI(zkAsset.address);
        const delegatedAddressPrivateKey = getOwnerPrivateKey();

        const proofSignature = signer.signApprovalForProof(
            zkAsset.address,
            transferProof.eth.outputs,
            delegatedAddress,
            true,
            delegatedAddressPrivateKey,
        );

        const { receipt } = await proxyContract.confidentialTransferFrom(
            proofs.JOIN_SPLIT_PROOF,
            zkAsset.address,
            transferProofData,
            delegatedAddress,
            proofSignature,
        );
        expect(receipt.status).to.equal(true);

        await Promise.all(
            transferOutputNotes.map(async (individualNote) => {
                const { status, noteOwner } = await ace.getNote(zkAsset.address, individualNote.noteHash);
                expect(status.toNumber()).to.equal(1);
                expect(noteOwner).to.equal(userAddress);
            }),
        );
    });
});

