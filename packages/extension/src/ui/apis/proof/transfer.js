import createNoteFromBalance from './createNoteFromBalance';

export default async function transfer({
    assetAddress,
    sender,
    transactions,
    numberOfInputNotes,
    numberOfOutputNotes,
}) {
    return createNoteFromBalance({
        assetAddress,
        sender,
        transactions,
        numberOfInputNotes,
        numberOfOutputNotes,
    });
}
