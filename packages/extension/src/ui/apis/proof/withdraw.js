import createNoteFromBalance from './createNoteFromBalance';

export default function withdraw({
    assetAddress,
    currentAddress,
    amount,
    sender,
    publicOwner,
    numberOfInputNotes,
}) {
    return createNoteFromBalance({
        assetAddress,
        currentAddress,
        amount,
        sender,
        publicOwner,
        numberOfInputNotes,
        numberOfOutputNotes: 0,
    });
}
