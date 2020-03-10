import {
    JoinSplitProof,
} from 'aztec.js';
import recoverNote from './recoverNote';

export default async function recoverJoinSplitProof({
    inputNotes: inputNotesData,
    outputNotes: outputNotesData,
    sender,
    publicValue,
    publicOwner,
}) {
    const inputNotes = await Promise.all(inputNotesData.map(recoverNote));
    const outputNotes = await Promise.all(outputNotesData.map(recoverNote));

    return new JoinSplitProof(
        inputNotes,
        outputNotes,
        sender,
        publicValue,
        publicOwner,
    );
}
