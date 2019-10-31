import createNoteFromBalance from './createNoteFromBalance';

export default function withdraw({
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
