import grantNoteAccess from './grantNoteAccess';
import DEPOSIT_PROOF from './DEPOSIT_PROOF';
import WITHDRAW_PROOF from './WITHDRAW_PROOF';
import TRANSFER_PROOF from './TRANSFER_PROOF';
import CREATE_NOTE_FROM_BALANCE_PROOF from './CREATE_NOTE_FROM_BALANCE_PROOF';

export default {
    grantNoteAccess,
    constructProof: {
        DEPOSIT_PROOF,
        WITHDRAW_PROOF,
        TRANSFER_PROOF,
        CREATE_NOTE_FROM_BALANCE_PROOF,
    },
};
