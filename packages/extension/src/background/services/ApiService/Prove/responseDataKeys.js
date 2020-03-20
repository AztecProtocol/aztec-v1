export default {
    DEPOSIT_PROOF: [
        'amount',
    ],
    WITHDRAW_PROOF: [
        'amount',
    ],
    TRANSFER_PROOF: [
        'amount',
        ({ outputNotes, remainderNote }) => {
            if (!outputNotes) return outputNotes;

            return {
                outputNotes: outputNotes.filter((note) => {
                    if (!remainderNote) return true;
                    return note.noteHash !== remainderNote.noteHash;
                }),
            };
        },
    ],
    CREATE_NOTE_FROM_BALANCE_PROOF: [
        'notes',
    ],
};
