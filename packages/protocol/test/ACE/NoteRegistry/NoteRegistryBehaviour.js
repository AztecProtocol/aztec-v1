// /* eslint-disable prefer-destructuring */
// /* global artifacts, expect, contract, beforeEach, it, web3:true */
// // ### External Dependencies
// const BN = require('bn.js');
// const truffleAssert = require('truffle-assertions');

// // ### Internal Dependencies
// /* eslint-disable-next-line object-curly-newline */
// const { encoder, JoinSplitProof, note, proof } = require('aztec.js');
// const secp256k1 = require('@aztec/secp256k1');
// const { constants: { addresses }, proofs } = require('@aztec/dev-utils');

// // ### Artifacts
// const ERC20Mintable = artifacts.require('./ERC20Mintable');
// const NoteRegistryData = artifacts.require('./noteRegistry/NoteRegistryData');
// const NoteRegistryBehaviour = artifacts.require('./noteRegistry/NoteRegistryBehaviour');
// const NoteRegistryOwner = artifacts.require('./test/ACE/NoteRegistryOwner');


// const { getNotesForAccount } = require('../../helpers/note');

// const { BOGUS_PROOF, JOIN_SPLIT_PROOF } = proofs;

// contract('NoteRegistryBehaviour', (accounts) => {
//     const [owner, notOwner, proofSender] = accounts;
//     const noteOwner = secp256k1.generateAccount();
//     const scalingFactor = new BN(1);
//     const startingBalance = new BN(100);

//     let NoteRegistryDataContract;
//     let NoteRegistryBehaviourContract;
//     let NoteRegistryOwnerContract;
//     let ConvertibleNoteRegistryData;
//     let ConvertibleNoteRegistryBehaviour;
//     let erc20;

//     beforeEach(async () => {
//         // Deploy data contract owned by an account
//         NoteRegistryDataContract = await NoteRegistryData.new(addresses.ZERO_ADDRESS, scalingFactor, false, false, { from: owner });
//         NoteRegistryBehaviourContract = await NoteRegistryBehaviour.new(NoteRegistryDataContract.address, { from: owner });
//         await NoteRegistryDataContract.transferOwnership(NoteRegistryBehaviourContract.address, { from: owner });

//         erc20 = await ERC20Mintable.new();
//         await erc20.mint(proofSender, scalingFactor.mul(startingBalance));

//         // Do the same for convertible contracts
//         ConvertibleNoteRegistryData = await NoteRegistryData.new(erc20.address, scalingFactor, false, true, { from: owner });

//         NoteRegistryOwnerContract = await NoteRegistryOwner.new(ConvertibleNoteRegistryData.address, { from: owner });
//         await erc20.mint(NoteRegistryOwnerContract.address, scalingFactor.mul(startingBalance));

//         const noteRegistryBehaviourAddress = await NoteRegistryOwnerContract.noteRegistryBehaviour();
//         ConvertibleNoteRegistryBehaviour = await NoteRegistryBehaviour.at(noteRegistryBehaviourAddress);
//         await ConvertibleNoteRegistryData.transferOwnership(noteRegistryBehaviourAddress, { from: owner });
//     });

//     describe('Success States', async () => {
//         it('should be ownable', async () => {
//             expect(await NoteRegistryBehaviourContract.owner()).to.equal(owner)
//         });

//         it('should own NoteRegistryData contract', async () => {
//             const behaviourAddress = NoteRegistryBehaviourContract.address;
//             expect(await NoteRegistryDataContract.owner()).to.equal(behaviourAddress)
//         });

//         it('should reference a NoteRegistryData contract', async () => {
//             const address = await NoteRegistryBehaviourContract.noteRegistryData();
//             expect(address).to.equal(NoteRegistryDataContract.address);
//         });

//         it('should allow owner to triger change of ownership of NoteRegistryData contract', async () => {
//             const newNoteRegistryBehaviourContract = await NoteRegistryBehaviour.new(NoteRegistryDataContract.address, { from: owner });
//             await NoteRegistryBehaviourContract.transferDataContract(newNoteRegistryBehaviourContract.address, { from: owner });
//             expect(await NoteRegistryDataContract.owner()).to.equal(newNoteRegistryBehaviourContract.address)
//         });

//         it('should enact a valid proof outputs object', async () => {
//             const notes = await getNotesForAccount(noteOwner, [10, 23]);
//             const depositProof = new JoinSplitProof([], notes, proofSender, 0, addresses.ZERO_ADDRESS);

//             await NoteRegistryBehaviourContract.updateNoteRegistry(JOIN_SPLIT_PROOF, depositProof.eth.output, proofSender, { from: owner });

//             const noteData = await NoteRegistryDataContract.getNote(notes[0].noteHash, { from: owner });
//             expect(noteData).to.not.equal(undefined);
//             expect(noteData.noteOwner).to.equal(noteOwner.address);
//             expect(noteData.status.toNumber()).to.equal(1);

//             const newNoteOwner = secp256k1.generateAccount();
//             const newNotes = await getNotesForAccount(newNoteOwner, [11, 22]);
//             const joinSplitProof = new JoinSplitProof(notes, newNotes, proofSender, 0, addresses.ZERO_ADDRESS);

//             await NoteRegistryBehaviourContract.updateNoteRegistry(JOIN_SPLIT_PROOF, joinSplitProof.eth.output, proofSender, { from: owner });
//             const newNoteData = await NoteRegistryDataContract.getNote(notes[0].noteHash, { from: owner });
//             expect(newNoteData.noteOwner).to.equal(noteOwner.address);
//             expect(newNoteData.status.toNumber()).to.equal(2);
//         });

//         it('should trigger a public token transferFrom given valid proof output object', async () => {
//             const depositValue = new BN(5);

//             const notes = await getNotesForAccount(noteOwner, [depositValue]);
//             const depositProof = new JoinSplitProof([], notes, proofSender, depositValue.mul(new BN(-1)), proofSender);

//             await erc20.approve(NoteRegistryOwnerContract.address, scalingFactor.mul(depositValue), { from: proofSender });
//             const approveData = ConvertibleNoteRegistryBehaviour
//                 .contract
//                 .methods
//                 .publicApprove(proofSender, depositProof.hash, depositValue.toNumber())
//                 .encodeABI();

//             await NoteRegistryOwnerContract.executeTransaction(ConvertibleNoteRegistryBehaviour.address, 0, approveData);

//             let publicApproval = await ConvertibleNoteRegistryData.getPublicApproval(proofSender, depositProof.hash);
//             expect(publicApproval.toNumber()).to.equal(depositValue.toNumber());

//             const depositData = ConvertibleNoteRegistryBehaviour
//                 .contract
//                 .methods
//                 .updateNoteRegistry(JOIN_SPLIT_PROOF, depositProof.eth.output, proofSender)
//                 .encodeABI();

//             await NoteRegistryOwnerContract.executeTransaction(ConvertibleNoteRegistryBehaviour.address, 0, depositData);

//             let registry = await ConvertibleNoteRegistryData.registry();
//             let newTotalSupply = registry.totalSupply;
//             // expect(newTotalSupply.toNumber()).to.equal(depositValue.toNumber());
//             publicApproval = await ConvertibleNoteRegistryData.getPublicApproval(proofSender, depositProof.hash);
//             expect(publicApproval.toNumber()).to.equal(0);

//             let proofSenderBalance = await erc20.balanceOf(proofSender);
//             expect(proofSenderBalance.toNumber()).to.equal((startingBalance.sub(depositValue)).toNumber());

//             const withdrawProof = new JoinSplitProof(notes, [], proofSender, depositValue, proofSender);
//             const withdrawData = ConvertibleNoteRegistryBehaviour
//                 .contract
//                 .methods
//                 .updateNoteRegistry(JOIN_SPLIT_PROOF, withdrawProof.eth.output, proofSender)
//                 .encodeABI();

//             await NoteRegistryOwnerContract.executeTransaction(ConvertibleNoteRegistryBehaviour.address, 0, withdrawData);

//             registry = await ConvertibleNoteRegistryData.registry();
//             newTotalSupply = registry.totalSupply;
//             expect(newTotalSupply.toNumber()).to.equal(0);

//             proofSenderBalance = await erc20.balanceOf(proofSender);
//             expect(proofSenderBalance.toNumber()).to.equal((startingBalance.toNumber()));
//         });
//     });

//     describe('Failure States', async () => {
//         it('should revert if non-owner tries to triger change of ownership of NoteRegistryData contract', async () => {
//             const newNoteRegistryBehaviourContract = await NoteRegistryBehaviour.new(NoteRegistryDataContract.address, { from: owner });
//             await truffleAssert.reverts(NoteRegistryBehaviourContract.transferDataContract(
//                 newNoteRegistryBehaviourContract.address, { from: notOwner }));
//         });

//         it('should not enact a valid proof outputs object if sent by non-owner', async () => {
//             const notes = await getNotesForAccount(noteOwner, [10, 23]);
//             const depositProof = new JoinSplitProof([], notes, proofSender, 0, addresses.ZERO_ADDRESS);

//             await truffleAssert.reverts(NoteRegistryBehaviourContract
//                 .updateNoteRegistry(JOIN_SPLIT_PROOF, depositProof.eth.output, proofSender, { from: notOwner }));

//             await truffleAssert.reverts(NoteRegistryDataContract.getNote(notes[0].noteHash, { from: owner }),
//                 'expected note to exist');
//         });
//     });
// });
