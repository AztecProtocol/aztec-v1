import {
    AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH,
} from '~/config/constants';
import {
    valueOf,
} from '~/utils/note';

export default function aztecNoteToData(note) {
    const decryptedViewingKey = note.getView();
    const {
        noteHash,
        owner,
        metaData,
    } = note;
    const customData = metaData.slice(AZTEC_JS_DEFAULT_METADATA_PREFIX_LENGTH + 2);

    return {
        noteHash,
        decryptedViewingKey,
        metadata: customData ? `0x${customData}` : '',
        value: valueOf(note),
        owner,
    };
}
