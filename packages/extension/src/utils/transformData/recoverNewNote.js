import {
    createNote,
} from '~/utils/note';

export default async function recoverNewNote([
    value,
    spendingPublicKey,
    to,
    userAccess,
]) {
    return createNote(value, spendingPublicKey, to, userAccess);
}
