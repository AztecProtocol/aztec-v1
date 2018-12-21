/* global artifacts, contract, beforeEach, expect, it:true */
/* eslint-disable no-console */
const BN = require('bn.js');
const Web3 = require('web3');

const AZTEC = artifacts.require('./contracts/AZTEC/AZTEC');
const AZTECInterface = artifacts.require('./contracts/AZTEC/AZTECInterface');
const AZTECERC20Bridge = artifacts.require('./contracts/AZTEC/AZTECERC20Bridge');
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');

const { sha3 } = require('web3-utils'); // TODO REMOVE

AZTEC.abi = AZTECInterface.abi; // hon hon hon

const aztecProof = require('../../aztec-crypto-js/proof/proof');
const proofHelpers = require('../../aztec-crypto-js/proof/helpers');
const secp256k1 = require('../../aztec-crypto-js/secp256k1/secp256k1');
const sign = require('../../aztec-crypto-js/eip712/sign');
const eip712 = require('../../aztec-crypto-js/eip712/eip712');
const exceptions = require('../exceptions');

const { t2, GROUP_MODULUS } = require('../../aztec-crypto-js/params');

const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));

// Step 1: make a token contract
// Step 2: make an aztec token contract
// Step 3: assign tokens from the token contract
// Step 4: blind tokens into note form
// Step 5: issue a join split transaction of confidential notes
// Step 6: redeem tokens from confidential form
const fakeNetworkId = 100;
contract('AZTEC - ERC20 Token Bridge Tests', (accounts) => {
    describe('success states', () => {
        let aztec;
        let aztecToken;
        let token;
        let aztecAccounts = [];
        let initialCommitments;
        let phaseTwoCommitments;
        let scalingFactor;
        const tokensTransferred = new BN(100000);

        before(async () => {
            token = await ERC20Mintable.new();
            aztec = await AZTEC.new(accounts[0]);
            AZTECERC20Bridge.link('AZTECInterface', aztec.address);
            aztecToken = await AZTECERC20Bridge.new(t2, token.address, 100000, fakeNetworkId, {
                from: accounts[0],
                gas: 5000000,
            });
            scalingFactor = await aztecToken.scalingFactor();

            const receipt = await web3.eth.getTransactionReceipt(aztecToken.transactionHash);
            console.log('gas spent creating contract = ', receipt.gasUsed);
            aztecAccounts = accounts.map(() => secp256k1.generateAccount());
            await Promise.all(accounts.map(account => token.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 5000000 }
            )));
            await Promise.all(accounts.map(account => token.approve(
                aztecToken.address,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 5000000 }
            ))); // approving tokens
        });

        it('AZTECERC20Bridge.sol contract has correct domain hash and public key', async () => {
            const storage = await Promise.all(Array.from({ length: 5 }, (v, i) => web3.eth.getStorageAt(aztecToken.address, i)));
            expect(t2[0]).to.equal(storage[0]);
            expect(t2[1]).to.equal(storage[1]);
            expect(t2[2]).to.equal(storage[2]);
            expect(t2[3]).to.equal(storage[3]);
            const domainTypes = {
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContract', type: 'address' },
                ],
            };
            const message = sign.generateAZTECDomainParams(aztecToken.address, fakeNetworkId);
            const domainHash = sha3(`0x${eip712.encodeMessageData(domainTypes, 'EIP712Domain', message)}`);
            expect(domainHash).to.equal(storage[4]);
        });

        it('successfully blinds 100,000 tokens into 5 zero-knowledge notes', async () => {
            const { commitments, m } = await proofHelpers.generateCommitmentSet({
                kIn: [],
                kOut: [9000, 11000, 10000, 13000, 57000],
            });
            initialCommitments = commitments;
            const kPublic = GROUP_MODULUS.sub(tokensTransferred);
            const { proofData, challenge } = aztecProof.constructJoinSplit(commitments, m, accounts[0], kPublic);
            const outputOwners = aztecAccounts.slice(0, 5).map(account => account.address);

            const result = await aztecToken.confidentialTransfer(proofData, m, challenge, [], outputOwners, '0x');
            const balance = await token.balanceOf(aztecToken.address);

            expect(balance.eq(scalingFactor.mul(tokensTransferred))).to.equal(true);
            console.log('gas spent = ', result.receipt.gasUsed);
        });

        it('succesfully enacts a join split transaction, splitting a 10000, 13000 notes into a 3000, 20000 notes', async () => {
            const { commitments: outputCommitments } = await proofHelpers.generateCommitmentSet({
                kIn: [],
                kOut: [3000, 20000],
            });
            phaseTwoCommitments = outputCommitments;
            const commitments = [initialCommitments[2], initialCommitments[3], ...outputCommitments];
            const m = 2;
            const { proofData, challenge } = aztecProof.constructJoinSplit(commitments, m, accounts[0], 0);
            const { address } = aztecToken;
            const signatures = [
                sign.signNote(proofData[0], challenge, accounts[0], address, aztecAccounts[2].privateKey, fakeNetworkId),
                sign.signNote(proofData[1], challenge, accounts[0], address, aztecAccounts[3].privateKey, fakeNetworkId),
            ];
            const outputOwners = [aztecAccounts[0].address, aztecAccounts[2].address];
            const result = await aztecToken.confidentialTransfer(proofData, m, challenge, signatures, outputOwners, '0x');
            console.log('gas spent = ', result.receipt.gasUsed);
        });

        it('succesfully enacts a join split transaction, redeeming 11999 tokens', async () => {
            const { commitments: outputCommitments } = await proofHelpers.generateCommitmentSet({ kIn: [], kOut: [1] });
            const commitments = [initialCommitments[0], phaseTwoCommitments[0], ...outputCommitments];
            const m = 2;
            const kPublic = 11999;
            const { proofData, challenge } = aztecProof.constructJoinSplit(commitments, m, accounts[3], kPublic);
            const { address } = aztecToken;
            const signatures = [
                sign.signNote(proofData[0], challenge, accounts[3], address, aztecAccounts[0].privateKey, fakeNetworkId),
                sign.signNote(proofData[1], challenge, accounts[3], address, aztecAccounts[0].privateKey, fakeNetworkId),
            ];
            const result = await aztecToken.confidentialTransfer(
                proofData,
                m,
                challenge,
                signatures,
                [aztecAccounts[0].address],
                '0x',
                { from: accounts[3], gas: 5000000 }
            );
            const userBalance = await token.balanceOf(accounts[3]);
            const contractBalance = await token.balanceOf(aztecToken.address);
            const balance = 100000 - 11999;

            expect(
                userBalance
                    .eq(scalingFactor.mul(new BN(111999)))
            ).to.equal(true);
            expect(
                contractBalance
                    .eq(scalingFactor.mul(balance))
            ).to.equal(true);
            console.log('gas spent = ', result.receipt.gasUsed);
        });
    });

    describe('failure states', () => {
        let aztec;
        let aztecToken;
        let token;
        let aztecAccounts = [];
        let initialCommitments;
        let scalingFactor;
        let outputOwners;
        const tokensTransferred = new BN(100000);

        before(async () => {
            token = await ERC20Mintable.new();
            aztec = await AZTEC.new(accounts[0]);
            AZTECERC20Bridge.link('AZTECInterface', aztec.address);
            aztecToken = await AZTECERC20Bridge.new(t2, token.address, 100000, fakeNetworkId, {
                from: accounts[0],
                gas: 5000000,
            });
            scalingFactor = await aztecToken.scalingFactor();
            const receipt = await web3.eth.getTransactionReceipt(aztecToken.transactionHash);
            console.log('gas spent creating contract = ', receipt.gasUsed);

            aztecAccounts = accounts.map(() => secp256k1.generateAccount());
            await Promise.all(accounts.map(account => token.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 5000000 }
            )));
            await Promise.all(accounts.map(account => token.approve(
                aztecToken.address,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 5000000 }
            ))); // approving tokens

            const { commitments, m } = await proofHelpers.generateCommitmentSet({
                kIn: [],
                kOut: [9000, 11000, 10000, 13000, 57000],
            });
            initialCommitments = commitments;

            const kPublic = GROUP_MODULUS.sub(tokensTransferred);
            const { proofData, challenge } = aztecProof.constructJoinSplit(commitments, m, accounts[0], kPublic);
            outputOwners = aztecAccounts.slice(0, 5).map(account => account.address);


            await aztecToken.confidentialTransfer(proofData, m, challenge, [], outputOwners, '0x');
            const balance = await token.balanceOf(aztecToken.address);

            expect(balance.eq(scalingFactor.mul(tokensTransferred))).to.equal(true);
        });

        it('invalid signatures cannot be used to spend non-existant notes', async () => {
            await token.transfer(
                aztecToken.address,
                scalingFactor.mul(200),
                { from: accounts[4], gas: 5000000 }
            );
            const { commitments } = await proofHelpers.generateCommitmentSet({ kIn: [100], kOut: [] });
            const { proofData, challenge } = aztecProof.constructJoinSplit(commitments, 1, accounts[3], 100);
            const signatures = [['0x0', '0x0', '0x0']];
            const m = 1;
            await exceptions.catchRevert(aztecToken.confidentialTransfer(
                proofData,
                m,
                challenge,
                signatures,
                [],
                '0x',
                { from: accounts[3], gas: 5000000 }
            ));
        });

        it('cannot create note with no owner', async () => {
            const { commitments, m } = await proofHelpers.generateCommitmentSet({
                kIn: [],
                kOut: [9000, 11000, 10000, 13000, 57000],
            });
            initialCommitments = commitments;
            const kPublic = GROUP_MODULUS.sub(tokensTransferred);
            const { proofData, challenge } = aztecProof.constructJoinSplit(commitments, m, accounts[4], kPublic);
            outputOwners = aztecAccounts.slice(0, 4).map(account => account.address);
            outputOwners.push('0x0');
            await exceptions.catchRevert(aztecToken.confidentialTransfer(
                proofData,
                m,
                challenge,
                [],
                outputOwners,
                '0x',
                { from: accounts[4], gas: 5000000 }
            ));
        });


        it('validate failure if AZTEC note owner attempts withdrawl greater than note value', async () => {
            const commitment = [initialCommitments[0]];
            const m = 1;

            const kPublic = 9001;
            const { proofData, challenge } = aztecProof.constructJoinSplit(commitment, m, accounts[0], kPublic);
            const { address } = aztecToken;
            const signatures = [
                sign.signNote(proofData[0], challenge, accounts[0], address, aztecAccounts[0].privateKey, fakeNetworkId),
            ];

            await exceptions.catchRevert(aztecToken.confidentialTransfer(
                proofData,
                m,
                challenge,
                signatures,
                [],
                '0x',
                { from: accounts[0], gas: 5000000 }
            ));
        });

        it('validate failure if msg.sender tries to create note value > their ERC20 balance', async () => {
            const { commitments, m } = await proofHelpers.generateCommitmentSet({
                kIn: [],
                kOut: [1],
            });
            const extraToken = new BN('1', 10);
            const kPublic = GROUP_MODULUS.sub(extraToken);

            const { proofData, challenge } = aztecProof.constructJoinSplit(
                commitments,
                m,
                accounts[0],
                kPublic
            );
            const outputOwner = [outputOwners[0]];

            await exceptions.catchRevert(aztecToken.confidentialTransfer(proofData, m, challenge, [], outputOwner, '0x', {
                from: accounts[0],
                gas: 2000000,
            }));
        });
    });
});
