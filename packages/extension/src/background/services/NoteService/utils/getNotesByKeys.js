import {
    get,
} from '~/utils/storage';
import Note from '~/background/database/models/note';

export default async function getNotesByKeys(noteKeys, {
    networkId,
}) {
    return Promise.all(noteKeys.map(async ({
        key,
        value,
    }) => {
        const noteHash = await get(key);
        const note = await Note.get({ networkId }, noteHash);
        return {
            ...note,
            value,
        };
    }));
}
