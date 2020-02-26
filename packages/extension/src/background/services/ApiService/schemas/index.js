import emptySchema from './emptySchema';
import user from './user';
import encryptMessage from './encryptMessage';
import decryptMessage from './decryptMessage';
import asset from './asset';
import assetBalance from './assetBalance';
import fetchNotesFromBalance from './fetchNotesFromBalance';
import note from './note';
import noteWithViewingKey from './noteWithViewingKey';
import grantNoteAccess from './grantNoteAccess';
import DEPOSIT_PROOF from './DEPOSIT_PROOF';
import WITHDRAW_PROOF from './WITHDRAW_PROOF';
import TRANSFER_PROOF from './TRANSFER_PROOF';
import CREATE_NOTE_FROM_BALANCE_PROOF from './CREATE_NOTE_FROM_BALANCE_PROOF';

export default {
    registerExtension: emptySchema,
    registerDomain: emptySchema,
    account: emptySchema,
    user,
    encryptMessage,
    decryptMessage,
    asset,
    assetBalance,
    fetchNotesFromBalance,
    note,
    noteWithViewingKey,
    grantNoteAccess,
    constructProof: {
        DEPOSIT_PROOF,
        WITHDRAW_PROOF,
        TRANSFER_PROOF,
        CREATE_NOTE_FROM_BALANCE_PROOF,
    },
};
