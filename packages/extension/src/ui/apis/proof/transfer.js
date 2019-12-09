import createNoteFromBalance from './createNoteFromBalance';

export default async function transfer({
    assetAddress,
    currentAddress,
    sender,
    transactions,
    numberOfInputNotes,
    numberOfOutputNotes,
    userAccessAccounts,
}) {
    return createNoteFromBalance({
        assetAddress,
        currentAddress,
        sender,
        transactions,
        publicOwner: currentAddress,
        numberOfInputNotes,
        numberOfOutputNotes,
        userAccessAccounts,
    });
}
