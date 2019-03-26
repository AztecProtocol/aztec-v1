/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft } = require('web3-utils');


// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { note, proof, secp256k1 } = require('aztec.js');
const { constants, proofs: { MINT_PROOF } } = require('@aztec/dev-utils');

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/AdjustSupplyInterface');
const ZkAssetMintable = artifacts.require('./contracts/ZkAsset/ZkAssetMintable');


AdjustSupply.abi = AdjustSupplyInterface.abi;

contract('ZkAssetMintable', (accounts) => {
    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let proofData;
        let erc20;
        let zkAssetMintable;
        let scalingFactor;
        let aztecAdjustSupply;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create fixed one
            notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            await ace.setCommonReferenceString(constants.CRS);
            aztecAdjustSupply = await AdjustSupply.new();
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);

            // Creating a fixed note
            const a = padLeft('1', 64);
            const k = padLeft('0', 8);
            const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
            const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
            const zeroNote = note.fromViewKey(viewingKey);

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            const canMintAndBurn = true;
            const canConvert = false;


            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(10);
            zkAssetMintable = await ZkAssetMintable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canMintAndBurn,
                canConvert,
                { from: accounts[0] }
            );

            ({ proofData } = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: zkAssetMintable.address,
            }));
        });

        it('should complete a mint operation', async () => {
            const { receipt } = await zkAssetMintable.confidentialMint(MINT_PROOF, proofData);
            expect(receipt.status).to.equal(true);
        });
    });
});
