import ensureInputNotes from '../utils/ensureInputNotes';

export default async function verifyCreateNoteFromBalanceRequest({
    assetAddress,
    amount,
    numberOfInputNotes,
}) {
    const noteError = await ensureInputNotes({
        assetAddress,
        numberOfInputNotes,
        amount,
    });
    if (noteError) {
        return noteError;
    }

    return null;
}
