import grantNoteAccess from './grantNoteAccess';
import DEPOSIT_PROOF from './DEPOSIT_PROOF';
import WITHDRAW_PROOF from './WITHDRAW_PROOF';
import TRANSFER_PROOF from './TRANSFER_PROOF';

export default {
    grantNoteAccess,
    constructProof: {
        DEPOSIT_PROOF,
        WITHDRAW_PROOF,
        TRANSFER_PROOF,
    },
};
