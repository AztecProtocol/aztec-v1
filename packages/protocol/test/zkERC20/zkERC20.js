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
const ZKERC20 = artifacts.require('./contracts/zkERC20/ZkERC20');
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

contract.only('zkERC20', (accounts) => {
    describe('success states', () => {
        let crs;
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let zkERC20;
        let scalingFactor;
        let aztec;
        let noteRegistryAddress;
        const proofs = [];
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
            aztec = await AZTEC.new(fakeNetworkId);
            await ace.setProof(1, aztec.address, true);

            proofs[0] = encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
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
            proofs[2] = encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(6, 8),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[2],
                kPublic: -130,
                aztecAddress: aztec.address,
            });
            proofs[3] = encodeJoinSplitTransaction({
                inputNotes: notes.slice(6, 8),
                outputNotes: notes.slice(4, 6),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(6, 8),
                publicOwner: accounts[2],
                kPublic: 40,
                aztecAddress: aztec.address,
            });
            proofs[4] = encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[3],
                kPublic: -30,
                aztecAddress: aztec.address,
            });
            proofs[5] = encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[3]],
                outputNotes: [notes[1], notes[2]],
                senderAddress: accounts[0],
                inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
                publicOwner: accounts[3],
                kPublic: 0, // perfectly balanced...
                aztecAddress: aztec.address,
            });

            erc20 = await ERC20Mintable.new();

            zkERC20 = await ZKERC20.new(
                false,
                false,
                true,
                10,
                erc20.address,
                ace.address
            );

            noteRegistryAddress = await zkERC20.noteRegistry();
            const noteRegistry = await NoteRegistry.at(noteRegistryAddress);
            scalingFactor = new BN(10);
            await Promise.all(accounts.map(account => erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            )));
            await Promise.all(accounts.map(account => erc20.approve(
                noteRegistryAddress,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            ))); // approving tokens
            const proofOutputs = proofs.map(({ expectedOutput }) => outputCoder.getProofOutput(expectedOutput, 0));
            const proofHashes = proofOutputs.map(proofOutput => outputCoder.hashProofOutput(proofOutput));
            await noteRegistry.publicApprove(
                proofHashes[0],
                10,
                { from: accounts[0] }
            );
            await noteRegistry.publicApprove(
                proofHashes[1],
                40,
                { from: accounts[1] }
            );
            await noteRegistry.publicApprove(
                proofHashes[2],
                130,
                { from: accounts[2] }
            );
            await noteRegistry.publicApprove(
                proofHashes[4],
                30,
                { from: accounts[3] }
            );
            await Promise.all(accounts.map(account => noteRegistry.publicApprove(
                noteRegistryAddress,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            ))); // approving tokens
        });

        it('will can update a note registry with output notes', async () => {
            // const { receipt } = await ace.validateProof(1, accounts[0], proofs[0].proofData);
            const { receipt } = await zkERC20.confidentialTransfer(proofs[0].proofData);
            expect(receipt.status).to.equal(true);
            console.log('receipt = ', receipt);
        });

        it('can update a note registry by consuming input notes, with kPublic negative', async () => {
            await zkERC20.confidentialTransfer(proofs[0].proofData);
            const { receipt } = await zkERC20.confidentialTransfer(proofs[1].proofData);
            expect(receipt.status).to.equal(true);
            console.log('second receipt = ', receipt);
        });

        it('can update a note registry by consuming input notes, with kPublic positive', async () => {
            await zkERC20.confidentialTransfer(proofs[2].proofData);
            const { receipt } = await zkERC20.confidentialTransfer(proofs[3].proofData);
            expect(receipt.status).to.equal(true);
        });

        it.only('can update a note registry with kPublic = 0', async () => {
            await zkERC20.confidentialTransfer(proofs[4].proofData);
            const { receipt } = await zkERC20.confidentialTransfer(proofs[5].proofData);
            expect(receipt.status).to.equal(true);
            console.log('final receipt = ', receipt);
            const gasUsed = await aztec.validateJoinSplit.estimateGas(proofs[5].proofData, accounts[0], crs, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used for raw crypto = ', gasUsed);
        });
    });
});
