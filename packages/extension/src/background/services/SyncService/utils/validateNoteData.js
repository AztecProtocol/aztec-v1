import {
    errorLog,
} from '~utils/log';
import {
    toCode,
} from '~utils/noteStatus';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    valueFromViewingKey,
    valueOf,
} from '~utils/note';

export default async function validateNoteData(note, privateKey) {
    const {
        viewingKey: encryptedVkString,
        status,
    } = note;

    let value = 0;
    try {
        const realViewingKey = fromHexString(encryptedVkString).decrypt(privateKey);
        const aztecNote = valueFromViewingKey(realViewingKey);
        value = valueOf(aztecNote);
    } catch (error) {
        errorLog('Failed to decrypt note from viewingKey.', {
            viewingKey: encryptedVkString,
            privateKey,
        });
        value = -1;
    }

    return {
        ...note,
        value,
        status: toCode(status),
    };
}
