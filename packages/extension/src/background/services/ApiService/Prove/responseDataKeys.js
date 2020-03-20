const fetchOutputNotes = ({ proofData }) => {
    const {
        outputNotes,
        remainderNote,
    } = proofData || {};
    if (!outputNotes) return null;

    return {
        outputNotes: outputNotes
            .filter((note) => {
                if (!remainderNote) return true;
                return note.decryptedViewingKey !== remainderNote.decryptedViewingKey;
            })
            .map(({
                noteHash,
                value,
            }) => ({
                noteHash,
                value,
            })),
    };
};

export default {
    DEPOSIT_PROOF: [
        fetchOutputNotes,
    ],
    WITHDRAW_PROOF: [],
    TRANSFER_PROOF: [
        fetchOutputNotes,
    ],
    CREATE_NOTE_FROM_BALANCE_PROOF: [
        (data) => {
            const {
                outputNotes,
            } = fetchOutputNotes(data) || {};

            return {
                notes: outputNotes || [],
            };
        },
    ],
};
