import aztec from 'aztec.js';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import {
    addAccess,
} from '~utils/metadata';

export default async function createNote(value, publicKey, owner, linkedPublicKey) {
    const note = await aztec.note.create(publicKey, value, owner);
    const viewingKey = encryptedViewingKey(linkedPublicKey, note.getView());
    const newMetaData = addAccess('', {
        address: owner,
        viewingKey: viewingKey.toHexString(),
    });
    note.setMetaData(newMetaData);
    return note;
}
