import {
    get,
} from '~/utils/storage';

export default async function getKeysByNoteHashes(noteHashes) {
    return Promise.all(noteHashes.map(async noteHash => get(noteHash)));
}
