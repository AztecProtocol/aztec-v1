import {
    get,
    set,
    lock,
} from '~/utils/storage';
import dataKey from '~/utils/dataKey';

const counterKey = '_countNote';

export default async function createNoteKey(noteHash) {
    let key;
    await lock(
        counterKey,
        async () => {
            const prevNoteKey = await get(noteHash);
            if (prevNoteKey) {
                key = prevNoteKey;
                return;
            }

            const count = await get(counterKey) || 0;
            key = dataKey('note', { count: count + 1 });
            await set({
                [counterKey]: count + 1,
                [noteHash]: key,
                [key]: noteHash,
            });
        },
    );

    return key;
}
