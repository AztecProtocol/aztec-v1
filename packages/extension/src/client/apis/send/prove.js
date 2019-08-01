import createNoteFromBalance from '../createNoteFromBalance/prove';

export default async function proveSend({
    assetAddress,
    transaction,
    sender,
    numberOfInputNotes,
    numberOfOutputNotes,
}) {
    return createNoteFromBalance({
        assetAddress,
        sender,
        transaction,
        numberOfInputNotes,
        numberOfOutputNotes,
    });
}
