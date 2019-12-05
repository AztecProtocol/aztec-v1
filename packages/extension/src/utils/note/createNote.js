import aztec from 'aztec.js';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~config/constants';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import {
    addAccess,
} from '~utils/metadata';

export default async function createNote(value, publicKey, owner, access) {
    const note = await aztec.note.create(publicKey, value, owner);

    if (access) {
        let accessUsers = access;
        if (typeof access === 'string') {
            accessUsers = [
                {
                    address: owner,
                    linkedPublicKey: access,
                },
            ];
        } else if (!Array.isArray(access)) {
            accessUsers = [access];
        }
        const realViewingKey = note.getView();
        const noteAccess = accessUsers.map(({
            address,
            linkedPublicKey,
        }) => {
            const viewingKey = encryptedViewingKey(linkedPublicKey, realViewingKey);
            return {
                address,
                viewingKey: viewingKey.toHexString(),
            };
        });
        const newMetaData = addAccess('', noteAccess);
        const customData = newMetaData.slice(METADATA_AZTEC_DATA_LENGTH + 2);
        note.setMetaData(`0x${customData}`);
    }

    return note;
}
