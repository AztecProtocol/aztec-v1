import createNoteFromBalance from './createNoteFromBalance';

export default function withdraw({
    assetAddress,
    amount,
    sender,
    to,
    numberOfInputNotes,
    gsnConfig,
}) {
    return createNoteFromBalance({
        assetAddress,
        amount,
        sender,
        publicOwner: to,
        numberOfInputNotes,
        numberOfOutputNotes: 0,
        gsnConfig,
    });
}
