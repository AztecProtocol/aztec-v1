
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~config/constants';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import metaData, {
    addAccess,
    toString,
} from '~utils/metadata';

export default async function grantNoteAccess({
    note: {
        decryptedViewingKey,
        metadata,
        noteHash,
        asset: {
            address: assetAddress,
        },
    },
    accounts,
}) {
    const noteAccess = accounts.map(({
        address,
        linkedPublicKey,
    }) => {
        const viewingKey = encryptedViewingKey(linkedPublicKey, decryptedViewingKey);
        return {
            address,
            viewingKey: viewingKey.toHexString(),
        };
    });
    const newMetaData = metaData(metadata);
    newMetaData.addAccess(noteAccess);

    return {
        metadata: newMetaData.toString(),
        noteHash,
        assetAddress,
    };
}
