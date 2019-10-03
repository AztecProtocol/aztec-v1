import createNoteFromBalance from './createNoteFromBalance';

export default function withdraw({
    assetAddress,
    sender,
    to,
    amount,
    numberOfInputNotes,
}) {
    return createNoteFromBalance({
        assetAddress,
        sender,
        publicOwner: to,
        amount,
        numberOfInputNotes,
        numberOfOutputNotes: 0,
    });
}
