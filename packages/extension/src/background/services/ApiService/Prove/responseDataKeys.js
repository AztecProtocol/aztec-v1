export default {
    DEPOSIT_PROOF: [
        'outputNotes',
    ],
    WITHDRAW_PROOF: [],
    TRANSFER_PROOF: [
        ({ proofData }) => {
            const {
                outputNotes,
                remainderNote,
            } = proofData || {};
            if (!outputNotes) return null;

            return {
                outputNotes: outputNotes.filter(note => note !== remainderNote),
            };
        },
    ],
    CREATE_NOTE_FROM_BALANCE_PROOF: [
        'notes',
    ],
};
