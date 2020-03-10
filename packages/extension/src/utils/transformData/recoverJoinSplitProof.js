import {
    JoinSplitProof,
} from 'aztec.js';
import recoverNote from './recoverNote';
import recoverNewNote from './recoverNewNote';

export default async function recoverJoinSplitProof({
    inputNotes: inputNotesData,
    outputNotes: outputNotesData,
    sender,
    publicValue,
    publicOwner,
}) {
    const inputNotes = await Promise.all(inputNotesData.map(recoverNote));
    const outputNotes = await Promise.all(outputNotesData.map(recoverNewNote));

    return new JoinSplitProof(
        inputNotes,
        outputNotes,
        sender,
        publicValue,
        publicOwner,
    );
}
