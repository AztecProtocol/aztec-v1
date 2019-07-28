import asyncMap from '~utils/asyncMap';
import createNote from './createNote';

export default async function createNotes(values, publicKey, owner) {
    return asyncMap(values, async val => createNote(val, publicKey, owner));
}
