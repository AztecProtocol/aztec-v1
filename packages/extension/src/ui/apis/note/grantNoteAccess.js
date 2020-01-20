import {
    metadata,
} from '@aztec/note-access';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import encryptedViewingKey from '~/utils/encryptedViewingKey';

export default function grantNoteAccess({
    note: {
        decryptedViewingKey,
        metadata: prevMetadata,
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

    const newMetaData = metadata(prevMetadata.slice(METADATA_AZTEC_DATA_LENGTH + 2));
    newMetaData.addAccess(noteAccess);

    const aztecData = prevMetadata
        ? prevMetadata.slice(0, METADATA_AZTEC_DATA_LENGTH + 2)
        : `0x${''.padEnd(METADATA_AZTEC_DATA_LENGTH, '0')}`;

    return {
        metadata: `${aztecData}${newMetaData.toString().slice(2)}`,
    };
}
