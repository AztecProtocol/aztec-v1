/* globals contract, artifacts, expect */
const {
    JoinSplitProof,
    note,
    signer: { signPermit },
} = require('aztec.js');
const { generateAccount } = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { randomHex } = require('web3-utils');

const ACE = artifacts.require('./ACE');
const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const Behaviour20200106 = artifacts.require('./Behaviour20200106/epochs/20200106/Behaviour20200106');
const Behaviour20200220 = artifacts.require('./Behaviour20200106/epochs/20200106/Behaviour20200220');
const DAI = artifacts.require('./test/ERC20/DAI/dai');
const ZkAsset = artifacts.require('ZkAssetOwnable');

const standardAccount = require('../../../helpers/getOwnerAccount');

contract('Behaviour20200220', async (accounts) => {
    let behaviour20200220;
    let manager;
    let proxyContract;
    let dai;
    let ace;
    let zkAsset;

    const opts = { from: accounts[0] };
    const updatedGSNSignerAddress = '0x5323B6bbD3421983323b3f4f0B11c2D6D3bCE1d8';

    // Signature params
    const chainID = 4;
    const nonce = 1;
    const expiry = -1; // a massive number in the contract
    const allowed = true;

    beforeEach(async () => {
        ace = await ACE.deployed();

        // deploy DAI contract
        dai = await DAI.new(chainID, opts);

        zkAsset = await ZkAsset.new(ace.address, dai.address, 1, {
            from: accounts[2],
        });

        const behaviour20200106 = await Behaviour20200106.new();
        const initialBehaviourAddress = behaviour20200106.address;
        const initialGSNSignerAddress = randomHex(20);
        manager = await AccountRegistryManager.new(initialBehaviourAddress, ace.address, initialGSNSignerAddress, opts);

        // perform behaviour upgrade
        behaviour20200220 = await Behaviour20200220.new();
        await manager.upgradeAccountRegistry(behaviour20200220.address);
        const proxyAddress = await manager.proxyAddress();
        proxyContract = await Behaviour20200220.at(proxyAddress);

        // set the GSN signer
        await proxyContract.setGSNSigner();
    });

    describe('Initialisation', async () => {
        it('should have set the GSN signer address', async () => {
            const updatedGSNSigner = await proxyContract.GSNSigner();
            expect(updatedGSNSigner.toString()).to.equal(updatedGSNSignerAddress);
        });

        it('should deploy DAI contract', async () => {
            expect(dai.address).to.not.equal(undefined);
        });
    });

    describe('Success states', async () => {
        it('should update allowance using direct DAI.permit() call', async () => {
            const holderAccount = generateAccount();
            const { address: holderAddress } = holderAccount;
            const spender = randomHex(20);
            const verifyingContract = dai.address;

            const permitSig = signPermit(chainID, verifyingContract, holderAccount, spender, nonce, expiry, allowed).slice(2);

            const r = `0x${permitSig.slice(0, 64)}`;
            const s = `0x${permitSig.slice(64, 128)}`;
            const v = `0x${permitSig.slice(128, 130)}`;

            const { receipt } = await dai.permit(holderAddress, spender, nonce, expiry, allowed, v, r, s);
            expect(receipt.status).to.equal(true);

            const allowance = await dai.allowance.call(holderAddress, spender);
            expect(allowance.toString()).to.not.equal('0');
        });

        it('should update allowance using indirect proxyContract.permit() call', async () => {
            const linkedTokenAddress = dai.address;
            const holderAccount = generateAccount();
            const { address: holderAddress } = holderAccount;

            const spender = proxyContract.address;
            const signature = signPermit(chainID, linkedTokenAddress, holderAccount, spender, nonce, expiry, allowed);

            const { receipt } = await proxyContract.permit(linkedTokenAddress, holderAddress, nonce, signature);
            expect(receipt.status).to.equal(true);

            const allowance = await dai.allowance.call(holderAddress, spender);
            expect(allowance.toString()).to.not.equal('0');
        });

        it('should perform deposit, making use of permit() call, without calling approve()', async () => {
            const { publicKey, address: holderAddress } = standardAccount;

            // mint DAI tokens
            const tokensMinted = 500;
            await dai.mint(holderAddress, tokensMinted, opts);

            const inputNotes = [];
            const outputNotes = [await note.create(publicKey, 10), await note.create(publicKey, 5)];
            const publicValue = -15;
            const sender = proxyContract.address;
            const publicOwner = proxyContract.address;

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const spender = proxyContract.address;
            const signature = signPermit(chainID, dai.address, standardAccount, spender, nonce, expiry, allowed);

            expect((await dai.balanceOf(holderAddress)).toNumber()).to.equal(tokensMinted);
            expect((await dai.balanceOf(ace.address)).toNumber()).to.equal(0);
            expect((await dai.balanceOf(proxyContract.address)).toNumber()).to.equal(0);

            // Note: No er20.approve() is being made, relying on permit() call in deposit() instead
            const proofData = depositProof.encodeABI(zkAsset.address);
            const proofHash = depositProof.hash;
            const depositAmount = publicValue * -1;

            const { receipt } = await proxyContract.deposit(
                zkAsset.address,
                holderAddress,
                proofHash,
                proofData,
                depositAmount,
                signature,
                nonce,
                { from: holderAddress },
            );
            expect(receipt.status).to.equal(true);
            expect((await dai.balanceOf(holderAddress)).toNumber()).to.equal(tokensMinted - depositAmount);
            expect((await dai.balanceOf(ace.address)).toNumber()).to.equal(depositAmount);
            expect((await dai.balanceOf(proxyContract.address)).toNumber()).to.equal(0);
        });
    });

    describe('Failure states', async () => {
        it('should fail to perform deposit if permit signature is fake', async () => {
            const { publicKey, address: holderAddress } = standardAccount;

            // mint DAI tokens
            const tokensMinted = 500;
            await dai.mint(holderAddress, tokensMinted, opts);

            const inputNotes = [];
            const outputNotes = [await note.create(publicKey, 10), await note.create(publicKey, 5)];
            const publicValue = -15;
            const sender = proxyContract.address;
            const publicOwner = proxyContract.address;

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const signature = randomHex(65);

            expect((await dai.balanceOf(holderAddress)).toNumber()).to.equal(tokensMinted);
            expect((await dai.balanceOf(ace.address)).toNumber()).to.equal(0);
            expect((await dai.balanceOf(proxyContract.address)).toNumber()).to.equal(0);

            // Note: No er20.approve() is being made, relying on permit() call in deposit() instead
            const proofData = depositProof.encodeABI(zkAsset.address);
            const proofHash = depositProof.hash;
            const depositAmount = publicValue * -1;

            await truffleAssert.reverts(
                proxyContract.deposit(zkAsset.address, holderAddress, proofHash, proofData, depositAmount, signature, nonce, {
                    from: holderAddress,
                }),
                'Dai/invalid-permit',
            );
        });
    });
});
