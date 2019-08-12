import aztec from 'aztec.js';
import {
    createNotes,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import address from '~utils/address';
import ApiError from '~client/utils/ApiError';
import validateAccount from '../utils/validateAccount';

export default async function proveSwap({
    makerBid,
    takerBid,
    takerAsk: {
        value: takerAskValue,
        noteAccess: takerAskNoteAccess,
        owner: takerAskOwner,
    },
    makerAsk: {
        value: makerAskValue,
        noteAccess: makerAskNoteAccess,
        owner: makerAskOwner,
    },
    sender,
}) {
    // in the swap proof we have two existing notes that are getting destroyed in return for the creation of two
    // output notes
    // The outputNotes should be created here so we are sure they are created correctly.
    const {
        SwapProof,
        ProofUtils,
        metaData,
        note,
    } = aztec;

    const taker = await validateAccount(takerAskOwner, true);
    const maker = await validateAccount(makerAskOwner, true);

    const makerBidNote = await window.aztec.note(makerBid);
    const makerAskNote = await note.create(maker.spendingPublicKey, makerAskValue, makerAskOwner, maker.linkedPublicKey);
    const takerBidNote = await window.aztec.note(takerBid);
    const takerAskNote = await note.create(taker.spendingPublicKey, takerAskValue, takerAskOwner, maker.linkedPublicKe);


    const inputNotes = [makerBidNote, takerBidNote];
    const outputNotes = [makerAskNote, takerAskNote];

    const metadata = metaData.extractNoteMetadata(notes);
    const proof = new SwapProof(
        inputNotes,
        outputNotes,
        sender,
    );

    return {
        proof,
        notes: {
            inputNotes,
            outputNotes,
        },
        sender,
    };
}
