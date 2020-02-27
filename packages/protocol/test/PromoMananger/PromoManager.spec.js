/* global artifacts, expect, contract, beforeEach, web3, it:true */

const truffleAssert = require('truffle-assertions');
const { keccak256, randomHex } = require('web3-utils');
const Web3EthAbi = require('web3-eth-abi');
const BN = require('bn.js');
const { JoinSplitProof, signer, note,
} = require('aztec.js');

const PromoManager = artifacts.require('./PromoManager/PromoManager');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ACE = artifacts.require('./ACE');
const secp256k1 = require('@aztec/secp256k1');
const helpers = require('../helpers/ERC1724');

const ZkAsset = artifacts.require('./ZkAsset');

contract('PromoManager', async (accounts) => {
    const trustedGSNSignerAddress = randomHex(20);
    let ace;
    let erc20;
    const publicOwner = accounts[0];
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);
    const sender = accounts[0];

    beforeEach(async () => {
        ace = await ACE.at(ACE.address);
        erc20 = await ERC20Mintable.new({ from: accounts[0] });
        console.log('doing first before');
    });

    describe.only('Success states', async () => {
        let zkAsset;
        let initialBehaviourAddress;
        const managerAccount = secp256k1.generateAccount();
        const scalingFactor = new BN(10);
        let fundNote;
        const totalValue = 100;
        let promoManager;

        beforeEach(async () => {
            console.log('doing second before');
            const opts = { from: accounts[0], gas: 4700000 };

            // [fundNote] = await helpers.getNotesForAccount(managerAccount, [totalValue]);
            fundNote = await note.create(managerAccount.publicKey, 100);
            // fundNote.owner = managerAccount.address;
            zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
            // fundNote.owner = promoManager.address;
            await erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred), opts);
            await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), opts);

            const proof = new JoinSplitProof([], [fundNote], accounts[0], -totalValue, accounts[0]);
            await ace.publicApprove(zkAsset.address, proof.hash, totalValue, { from: accounts[0] });
            const data = proof.encodeABI(zkAsset.address);
            const { receipt: firstProofReceipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, '0x', {
                from: accounts[0],
            });
            expect(firstProofReceipt.status).to.equal(true);

            promoManager = await PromoManager.new(ace.address, managerAccount.address, erc20.address, zkAsset.address, fundNote.noteHash);
        });
        describe('Initialisation', async () => {

            it('should initialise with a note hash', async () => {

                const {receipt} = await promoManager.initialize(ace.address, managerAccount.address,erc20.address, zkAsset.address, fundNote.noteHash);
                expect(receipt.status).to.equal(true);

            });

            it('should be able to call setCodes', async () => {
                await promoManager.initialize(ace.address, managerAccount.address, erc20.address, zkAsset.address, fundNote.noteHash);
                const [code1,remainder] = await helpers.getNotesForAccount(managerAccount, [10, 90]);
                // code1.owner = promoManager.address;
                // remainder.owner = promoManager.address;
                const proofSetCodes = new JoinSplitProof([fundNote], [remainder, code1], promoManager.address, 0 ,accounts[0]);
                console.log('signNote',

                    zkAsset.address,
                    fundNote.noteHash,
                    promoManager.address,
                    true,
                    managerAccount.privateKey,
                );
                const signature = signer.signNoteForConfidentialApprove(
                    zkAsset.address,
                    fundNote.noteHash,
                    promoManager.address,
                    true,
                    managerAccount.privateKey,
                );

                console.log(zkAsset.address, promoManager.address);


                const { receipt: approveReceipt } = await zkAsset.confidentialApprove(fundNote.noteHash, promoManager.address,true ,signature);
                console.log(approveReceipt);
                const loggedApprovalStatus = await zkAsset.confidentialApproved.call(fundNote.noteHash, promoManager.address);
                expect(loggedApprovalStatus).to.equal(true);
                expect(approveReceipt.status).to.equal(true);
                const proofDataSetCodes = proofSetCodes.encodeABI(promoManager.address);

                // spend note

                const {receipt} = await promoManager.setCodes([keccak256(Web3EthAbi.encodeParameters(['string'], ['1234']))], proofDataSetCodes);
                expect(receipt.status).to.equal(true);

            });

            it('should be able to call claim1 a code', async () => {

                await promoManager.initialize(ace.address, managerAccount.address, erc20.address, zkAsset.address, fundNote.noteHash);
                const [code1,remainder] = await helpers.getNotesForAccount(managerAccount, [10, 90]);
                // code1.owner = promoManager.address;
                // remainder.owner = promoManager.address;
                const proofSetCodes = new JoinSplitProof([fundNote], [code1, remainder], promoManager.address,0 ,accounts[0]);
                console.log('signNote',

                    zkAsset.address,
                    fundNote.noteHash,
                    promoManager.address,
                    true,
                    managerAccount.privateKey,
                );
                const signature = signer.signNoteForConfidentialApprove(
                    zkAsset.address,
                    fundNote.noteHash,
                    promoManager.address,
                    true,
                    managerAccount.privateKey,
                );

                console.log(zkAsset.address, promoManager.address);


                const { receipt: approveReceipt } = await zkAsset.confidentialApprove(fundNote.noteHash, promoManager.address,true ,signature);
                console.log(approveReceipt);
                const loggedApprovalStatus = await zkAsset.confidentialApproved.call(fundNote.noteHash, promoManager.address);
                expect(loggedApprovalStatus).to.equal(true);

                const proofDataSetCodes = proofSetCodes.encodeABI(promoManager.address);

                // spend note

                const {receipt} = await promoManager.setCodes([keccak256(Web3EthAbi.encodeParameter('string', '1234'))], proofDataSetCodes);
                expect(receipt.status).to.equal(true);

                const {receipt: receipt2} = await promoManager.claim1(keccak256(Web3EthAbi.encodeParameters(['string', 'uint256', 'address'], ['1234', 55, accounts[0]])));
                expect(receipt2.status).to.equal(true);

            });
            it.only('should be able to call claim2 a code', async () => {

                await promoManager.initialize(ace.address, managerAccount.address, erc20.address, zkAsset.address, fundNote.noteHash);
                const [code1,remainder] = await helpers.getNotesForAccount(managerAccount, [10, 90]);
                const proofSetCodes = new JoinSplitProof([fundNote], [remainder, code1], promoManager.address,0 ,accounts[0]);
                const proofDataSetCodes = proofSetCodes.encodeABI(promoManager.address);
                const signature = signer.signNoteForConfidentialApprove(
                    zkAsset.address,
                    fundNote.noteHash,
                    promoManager.address,
                    true,
                    managerAccount.privateKey,
                );
                await zkAsset.confidentialApprove(fundNote.noteHash, promoManager.address,true ,signature);

                const {receipt} = await promoManager.setCodes([keccak256(Web3EthAbi.encodeParameters(['string'], ['1234']))], proofDataSetCodes);
                expect(receipt.status).to.equal(true);

                const {receipt: receipt2} = await promoManager.claim1(keccak256(Web3EthAbi.encodeParameters(['string', 'uint256', 'address'], ['1234', 55, accounts[0]])));
                const signature2 = signer.signNoteForConfidentialApprove(
                    zkAsset.address,
                    code1.noteHash,
                    promoManager.address,
                    true,
                    managerAccount.privateKey,
                );
                await zkAsset.confidentialApprove(code1.noteHash, promoManager.address,true ,signature2);

                expect(receipt2.status).to.equal(true);
                const [code1New] = await helpers.getNotesForAccount(managerAccount, [10]);
                const proof2 = new JoinSplitProof([code1], [code1New], promoManager.address,0 ,accounts[0]);
                const proofData2 = proof2.encodeABI(promoManager.address);
                const {receipt: receipt3} = await promoManager.claim2('1234', 55, proofData2);
                expect(receipt3.status).to.equal(true);
            });
        });
    });
});

