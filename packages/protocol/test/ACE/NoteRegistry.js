/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies

const {
    proof,
    abiEncoder,
    params: { t2 },
    secp256k1,
    sign,
    note,
// eslint-disable-next-line import/no-unresolved
} = require('aztec.js');

const { joinSplit: aztecProof } = proof;
const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const AZTEC = artifacts.require('./contracts/ACE/validators/AZTECJoinSplit');
const AZTECInterface = artifacts.require('./contracts/ACE/validators/AZTECJoinSplitInterface');
const NoteRegistry = artifacts.require('./contracts/ACE/NoteRegistry');

AZTEC.abi = AZTECInterface.abi;

const fakeNetworkId = 100;

function encodeJoinSplitTransaction({
    inputNotes,
    outputNotes,
    senderAddress,
    inputNoteOwners,
    publicOwner,
    kPublic,
    aztecAddress,
}) {
    const m = inputNotes.length;
    const {
        proofData: proofDataRaw,
        challenge,
    } = aztecProof.constructJoinSplitModified([...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner);

    const inputSignatures = inputNotes.map((inputNote, index) => {
        const { privateKey } = inputNoteOwners[index];
        return sign.signACENote(
            proofDataRaw[index],
            challenge,
            senderAddress,
            aztecAddress,
            privateKey,
            fakeNetworkId
        );
    });
    const outputOwners = outputNotes.map(n => n.owner);
    const proofData = abiEncoder.joinSplit.encode(
        proofDataRaw,
        m,
        challenge,
        publicOwner,
        inputSignatures,
        outputOwners,
        outputNotes
    );
    const expectedOutput = `0x${abiEncoder.outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue: kPublic,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput };
}

const hx = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
const hy = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);

contract('NoteRegistry', (accounts) => {
    describe('success states', () => {
        let crs;
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let noteRegistry;
        let scalingFactor;
        const proofs = [];
        let proofOutputs = [];
        const tokensTransferred = new BN(100000);


        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            crs = [
                `0x${padLeft(hx.toString(16), 64)}`,
                `0x${padLeft(hy.toString(16), 64)}`,
                ...t2,
            ];
            await ace.setCommonReferenceString(crs);
            const aztec = await AZTEC.new(fakeNetworkId);
            await ace.setProof(1, aztec.address, true);
            const inputNotes = [];
            const outputNotes = notes.slice(0, 2);
            const kPublic = -10;
            const publicOwner = accounts[0];
            proofs[0] = encodeJoinSplitTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner,
                kPublic,
                aztecAddress: aztec.address,
            });
            proofs[1] = encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                aztecAddress: aztec.address,
            });
            proofOutputs = proofs.map(({ expectedOutput }) => outputCoder.getProofOutput(expectedOutput, 0));

            erc20 = await ERC20Mintable.new();
            noteRegistry = await NoteRegistry.new(
                false,
                true,
                10,
                erc20.address,
                ace.address,
                accounts[0]
            );

            scalingFactor = new BN(10);
            await Promise.all(accounts.map(account => erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            )));
            await Promise.all(accounts.map(account => erc20.approve(
                noteRegistry.address,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            ))); // approving tokens
        });

        it('will can update a note registry with output notes', async () => {
            const { receipt: aceReceipt } = await ace.validateProof(1, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            const { receipt: regReceipt } = await noteRegistry.updateNoteRegistry(formattedProofOutput, 1, accounts[0]);
            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes', async () => {
            await ace.validateProof(1, accounts[0], proofs[0].proofData);
            await noteRegistry.updateNoteRegistry(`0x${proofOutputs[0].slice(0x40)}`, 1, accounts[0]);

            const { receipt: aceReceipt } = await ace.validateProof(1, accounts[0], proofs[1].proofData);
            const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            const { receipt: regReceipt } = await noteRegistry.updateNoteRegistry(formattedProofOutput, 1, accounts[0]);
            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });
    });
});
