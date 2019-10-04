import createNoteFromBalance from './createNoteFromBalance';

export default async function transfer({
    assetAddress,
    sender,
    transactions,
    numberOfInputNotes,
}) {
    return createNoteFromBalance({
        assetAddress,
        sender,
        transactions,
        numberOfInputNotes,
        numberOfOutputNotes: 0,
    });
}
