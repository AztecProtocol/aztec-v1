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
            const opts = { from: accounts[0], gas: 4700000 };

            // [fundNote] = await helpers.getNotesForAccount(managerAccount, [totalValue]);
            promoManager = await PromoManager.new(ace.address, managerAccount.addreess, zkAsset.address );
            fundNote = await note.create(managerAccount.publicKey, 100);
            fundNote.owner = promoManager.address;
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

        });
        describe('Initialisation', async () => {

            it('should initialise with a note hash', async () => {

                const {receipt} = await promoManager.initialize( fundNote.noteHash);
                expect(receipt.status).to.equal(true);

            });

            it('should be able to call setCodes', async () => {
                const {receipt} = await promoManager.initialize( fundNote.noteHash);
                const [code1,remainder] = await helpers.getNotesForAccount(managerAccount, [10, 90]);
                code1.owner = promoManager.address;
                remainder.owner = promoManager.address;
                const proofSetCodes = new JoinSplitProof([fundNote], [remainder, code1], promoManager.address, 0 ,accounts[0]);

                console.log(zkAsset.address, promoManager.address);


                const proofDataSetCodes = proofSetCodes.encodeABI(promoManager.address);

                // spend note

                const {receipt} = await promoManager.setCodes([keccak256(Web3EthAbi.encodeParameters(['string'], ['1234']))], proofDataSetCodes);
                expect(receipt.status).to.equal(true);

            });

            it('should be able to call claim1 a code', async () => {

                const {receipt} = await promoManager.initialize( fundNote.noteHash);
                const [code1,remainder] = await helpers.getNotesForAccount(managerAccount, [10, 90]);
                code1.owner = promoManager.address;
                remainder.owner = promoManager.address;
                const proofSetCodes = new JoinSplitProof([fundNote], [code1, remainder], promoManager.address,0 ,accounts[0]);

                console.log(zkAsset.address, promoManager.address);



                const proofDataSetCodes = proofSetCodes.encodeABI(promoManager.address);

                // spend note

                const {receipt} = await promoManager.setCodes([keccak256(Web3EthAbi.encodeParameter('string', '1234'))], proofDataSetCodes);
                expect(receipt.status).to.equal(true);

                const {receipt: receipt2} = await promoManager.claim1(keccak256(Web3EthAbi.encodeParameters(['string', 'uint256', 'address'], ['1234', 55, accounts[0]])));
                expect(receipt2.status).to.equal(true);

            });
            it('should be able to call claim2 a code', async () => {

                const {receipt} = await promoManager.initialize( fundNote.noteHash);
                const [code1,remainder] = await helpers.getNotesForAccount(managerAccount, [10, 90]);
                code1.owner = promoManager.address;
                remainder.owner = promoManager.address;
                const proofSetCodes = new JoinSplitProof([fundNote], [remainder, code1], promoManager.address,0 ,accounts[0]);
                const proofDataSetCodes = proofSetCodes.encodeABI(promoManager.address);

                const {receipt} = await promoManager.setCodes([keccak256(Web3EthAbi.encodeParameters(['string'], ['1234']))], proofDataSetCodes);
                expect(receipt.status).to.equal(true);

                const {receipt: receipt2} = await promoManager.claim1(keccak256(Web3EthAbi.encodeParameters(['string', 'uint256', 'address'], ['1234', 55, accounts[0]])));

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

