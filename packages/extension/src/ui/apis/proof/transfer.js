import createNoteFromBalance from './createNoteFromBalance';

export default async function transfer({
    assetAddress,
    currentAddress,
    sender,
    transactions,
    numberOfInputNotes,
    numberOfOutputNotes,
}) {
    return createNoteFromBalance({
        assetAddress,
        currentAddress,
        sender,
        transactions,
        publicOwner: currentAddress,
        numberOfInputNotes,
        numberOfOutputNotes,
    });
}
