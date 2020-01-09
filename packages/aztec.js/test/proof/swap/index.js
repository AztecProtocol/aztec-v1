import secp256k1 from '@aztec/secp256k1';
import { expect } from 'chai';
import { randomHex } from 'web3-utils';
import note from '../../../src/note';
import { SwapProof } from '../../../src/proof';

describe('Swap Proof', () => {
    let inputNotes = [];
    const inputNotesValues = [10, 20];
    let outputNotes = [];
    const outputNotesValues = [10, 20];
    const { publicKey } = secp256k1.generateAccount();
    const sender = randomHex(20);

    before(async () => {
        inputNotes = await Promise.all(inputNotesValues.map((inputValue) => note.create(publicKey, inputValue)));
        outputNotes = await Promise.all(outputNotesValues.map((outputValue) => note.create(publicKey, outputValue)));
    });

    it('should construct a Swap proof with well-formed outputs', async () => {
        const proof = new SwapProof(inputNotes, outputNotes, sender);
        expect(proof.data.length).to.equal(4);
        expect(proof.data[0].length).to.equal(6);
        expect(proof.data[1].length).to.equal(6);
        expect(proof.data[2].length).to.equal(6);
        expect(proof.data[3].length).to.equal(6);
    });

    it('should construct a Swap proof with satisfied blinding scalar relations', async () => {
        // i.e. bk1 = bk3 and bk2 = bk4
        const proof = new SwapProof(inputNotes, outputNotes, sender);
        const testk1 = proof.blindingFactors[0].bk.toString(16);
        const testk2 = proof.blindingFactors[1].bk.toString(16);
        const testk3 = proof.blindingFactors[2].bk.toString(16);
        const testk4 = proof.blindingFactors[3].bk.toString(16);
        expect(testk1).to.equal(testk3);
        expect(testk2).to.equal(testk4);
    });
});
