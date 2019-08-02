import asyncMap from '~utils/asyncMap';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import {
    addAccess,
} from '~utils/metadata';
import createNote from './createNote';

export default async function createNotes(values, publicKey, owner, linkedPublicKey) {
    return asyncMap(values, async (val) => {
        const note = await createNote(val, publicKey, owner);
        const realViewingKey = note.getView();

        // const viewingKey = encryptedViewingKey(linkedPublicKey, realViewingKey);
        // const newMetadata = addAccess('', {
        //     address: owner,
        //     viewingKey: viewingKey.toHexString(),
        // });
        // console.log(newMetadata.slice(196).length);
        // note.setMetadata(`${newMetadata.slice(196)}`);
        // console.log(note);
        return note;
    });
}
