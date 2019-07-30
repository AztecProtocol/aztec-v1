import createNoteFromBalance from '../createNoteFromBalance/prove';

export default async function proveWithdraw({
    assetAddress,
    amount,
    sender,
    numberOfInputNotes,
}) {
    return createNoteFromBalance({
        assetAddress,
        amount,
        sender,
        numberOfInputNotes,
        numberOfOutputNotes: 0,
    });
}
