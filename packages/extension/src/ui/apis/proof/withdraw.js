import createNoteFromBalance from './createNoteFromBalance';

export default function withdraw({
    assetAddress,
    sender,
    transactions,
    numberOfInputNotes,
    gsnConfig,
}) {
    return createNoteFromBalance({
        assetAddress,
        sender,
        transactions,
        numberOfInputNotes,
        numberOfOutputNotes: 0,
        gsnConfig,
    });
}
