import aztec from 'aztec.js';
import {
    createNote,
    valueOf,
} from '~utils/note';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';
import validateAccount from '../utils/validateAccount';

const {
    BurnProof,
} = aztec;

export default async function proveBurn({
    assetAddress,
    notes,
    sender,
}) {
    const notesOwner = await validateAccount(sender, true);

    let confidentialTotalBurned;
    try {
        ({
            confidentialTotalBurned,
        } = await Web3Service
            .useContract('ACE')
            .method('getRegistry')
            .call(assetAddress));
    } catch (error) {
        throw new ContractError('ace.getRegistry', {
            messageOptions: {
                asset: assetAddress,
            },
            error,
        });
    }

    let balance;
    let oldBurnedCounterNote;

    const zeroNote = await aztec.note.createZeroValueNote();
    if (confidentialTotalBurned === zeroNote.noteHash) {
        balance = 0;
        oldBurnedCounterNote = zeroNote;
    } else {
        // TODO
    }

    const {
        address: ownerAddress,
        spendingPublicKey,
    } = notesOwner;

    const amount = notes.reduce((accum, n) => accum + valueOf(n), 0);
    const newBurnedCounterNote = await createNote(
        balance + amount,
        spendingPublicKey,
        ownerAddress,
    );

    const proof = new BurnProof(
        oldBurnedCounterNote,
        newBurnedCounterNote,
        notes,
        assetAddress,
    );

    return {
        proof,
        notesOwner,
        inputNotes: notes,
    };
}
