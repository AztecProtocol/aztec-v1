import aztec from 'aztec.js';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~config/constants';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import {
    addAccess,
} from '~utils/metadata';

export default async function createNote(value, publicKey, owner, linkedPublicKey) {
    const note = await aztec.note.create(publicKey, value, owner);

    if (linkedPublicKey) {
        const viewingKey = encryptedViewingKey(linkedPublicKey, note.getView());
        const newMetaData = addAccess('', {
            address: owner,
            viewingKey: viewingKey.toHexString(),
        });
        note.setMetaData(newMetaData.slice(METADATA_AZTEC_DATA_LENGTH + 2));
    }

    return note;
}
