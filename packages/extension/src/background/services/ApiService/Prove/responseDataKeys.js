const fetchOutputNotes = ({
    proofData,
    proof,
    signature,
    signature2,
}) => {
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
        proof,
        signature,
        signature2,

    };
};

const returnProof = ({ proof, signature, signature2 }) => ({
    proof,
    signature,
    signature2,
});

export default {
    DEPOSIT_PROOF: [
        fetchOutputNotes,
        returnProof,
    ],
    WITHDRAW_PROOF: [],
    TRANSFER_PROOF: [
        fetchOutputNotes,
        returnProof,
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
