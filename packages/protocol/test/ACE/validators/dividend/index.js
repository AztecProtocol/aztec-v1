/* global artifacts, expect, contract, it:true */
const { DividendProof, encoder, note, proofOld } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const { mockZeroDividendProof } = require('../../../helpers/proof');

const Dividend = artifacts.require('./Dividend');
const DividendInterface = artifacts.require('./DividendInterface');
Dividend.abi = DividendInterface.abi;

let dividendValidator;
const { publicKey } = secp256k1.generateAccount();

const getNotes = async (notionalNoteValue, residualNoteValue, targetNoteValue) => {
    const notionalNote = await note.create(publicKey, notionalNoteValue);
    const residualNote = await note.create(publicKey, residualNoteValue);
    const targetNote = await note.create(publicKey, targetNoteValue);
    return { notionalNote, residualNote, targetNote };
};

const getDefaultNotes = async () => {
    const notionalNoteValue = 90;
    const residualNoteValue = 4;
    const targetNoteValue = 50;
    const { notionalNote, residualNote, targetNote } = await getNotes(notionalNoteValue, residualNoteValue, targetNoteValue);
    const za = 100;
    const zb = 5;
    return { notionalNote, residualNote, targetNote, za, zb };
};

contract.only('Dividend Validator', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        dividendValidator = await Dividend.new({ from: sender });
    });

    describe('Success States', () => {
        it('should validate Dividend proof', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            const result = await dividendValidator.validateDividend(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Dividend proof with challenge that has GROUP_MODULUS added to it', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = proof.challenge.add(constants.GROUP_MODULUS);
            proof.constructOutput();
            const data = proof.encodeABI();
            const result = await dividendValidator.validateDividend(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(proof.eth.output);
        });
    });

    describe('Failure States', () => {
        it('should fail if notes do NOT balance', async () => {
            const notionalNoteValue = 90;
            const residualNoteValue = 3;
            const targetNoteValue = 50;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 0 notes', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 1 notes instead of 3', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [proof.data[0]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 2 notes instead of 3', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [proof.data[0], proof.data[1]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if notional note is 0', async () => {
            const notionalNoteValue = 0;
            const residualNoteValue = 4;
            const targetNoteValue = 50;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if residual note is 0', async () => {
            const notionalNoteValue = 90;
            const residualNoteValue = 0;
            const targetNoteValue = 50;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if target note is 0', async () => {
            const notionalNoteValue = 90;
            const residualNoteValue = 4;
            const targetNoteValue = 0;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail for for za > K_MAX', async () => {
            const { notionalNote, residualNote, targetNote } = await getDefaultNotes();
            const za = constants.K_MAX + 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail for for zb > K_MAX', async () => {
            const { notionalNote, residualNote, targetNote } = await getDefaultNotes();
            const za = 100;
            const zb = constants.K_MAX + 100;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed proof data', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [];
            for (let i = 0; i < 4; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if points NOT on curve', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const zeroDividendProof = await mockZeroDividendProof();
            proof.data = zeroDividendProof.data;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        // TODO: investigate why this test doesn't revert
        it.skip('should fail if scalars NOT modulo GROUP_MODULUS', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();

            // const inputNotes = [notionalNote];
            // const outputNotes = [residualNote, targetNote];

            // const proofConstruct = proofOld.dividend.constructProof([...inputNotes, ...outputNotes], za, zb, sender);

            // const proofDataRawFormatted = [proofConstruct.proofData.slice(0, 6)].concat([
            //     proofConstruct.proofData.slice(6, 12),
            //     proofConstruct.proofData.slice(12, 18),
            // ]);

            // const outputOwners = [...outputNotes.map((n) => n.owner)];
            // const inputOwners = [...inputNotes.map((n) => n.owner)];

            // // Generate scalars that NOT mod r
            // const kBarBN = new BN(proofConstruct.proofData[0][0].slice(2), 16);
            // const notModRKBar = `0x${kBarBN.add(constants.GROUP_MODULUS).toString(16)}`;

            // proofDataRawFormatted[0][0] = notModRKBar;

            // const proofData = encoder.inputCoder.dividend(
            //     proofDataRawFormatted,
            //     proofConstruct.challenge,
            //     za,
            //     zb,
            //     inputOwners,
            //     outputOwners,
            //     outputNotes,
            // );

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const kBar = new BN(proof.data[0][0].slice(2), 16);
            proof.data[0][0] = `0x${kBar.add(constants.GROUP_MODULUS).toString(16)}`;
            console.log(`0x${kBar.add(constants.GROUP_MODULUS).toString(16)}`);
            const data = proof.encodeABI();

            // console.log({ groupModulus: constants.GROUP_MODULUS });
            // console.log({ proofData });
            // console.log({ data });

            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars are 0', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const zeroScalar = padLeft('0x00', 64);
            proof.data[0][0] = zeroScalar;
            proof.data[0][1] = zeroScalar;
            proof.data[1][0] = zeroScalar;
            proof.data[1][1] = zeroScalar;
            proof.data[2][0] = zeroScalar;
            proof.data[2][1] = zeroScalar;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${constants.H_X.toString(16)}`;
            proof.data[0][3] = `0x${constants.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${constants.H_X.toString(16)}`;
            proof.data[0][5] = `0x${constants.H_Y.toString(16)}`;
            proof.challenge = new BN('0a', 16);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed challenge', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = new BN('0');
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if sender NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // First element should have been the sender
            proof.constructChallengeRecurse([proof.za, proof.zb, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if za NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Second element should have been za
            proof.constructChallengeRecurse([proof.sender, proof.zb, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if zb NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Third element should have been zb
            proof.constructChallengeRecurse([proof.sender, proof.za, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if notes NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Fourth element should have been the notes
            proof.constructChallengeRecurse([proof.sender, proof.za, proof.zb, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blinding factors NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Fifth element should have been the blinding factors
            proof.constructChallengeRecurse([proof.sender, proof.za, proof.zb, proof.notes]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed H_X, H_Y in CRS', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            const malformedHx = constants.H_X.add(new BN(1));
            const malformedHy = constants.H_Y.add(new BN(1));
            const bogusCRS = [`0x${malformedHx.toString(16)}`, `0x${malformedHy.toString(16)}`, ...constants.t2];
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bogusCRS),
                truffleAssert.ErrorType.REVERT,
            );
        });
    });
});
