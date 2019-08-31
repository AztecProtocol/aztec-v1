import {
    stripLeadingZeros
} from './stripLeadingZeros';
import {
    METADATA_PREFIX_LEN,
    METADATA_VAR_LEN,
    METADATA_ADDRESS_LEN,
    METADATA_VIEWING_KEY_LEN,
} from '../config/constants';


export default function parseNoteAccessFromMetadata(metadata) {
    let accessMap = new Map();

    if (metadata && metadata.length > METADATA_PREFIX_LEN) {
        let addressLenStr = stripLeadingZeros(metadata.slice(METADATA_PREFIX_LEN, METADATA_PREFIX_LEN + METADATA_VAR_LEN));
        console.log(`addressLenStr: ${addressLenStr}`);
        let addressesLen = addressLenStr;//Bytes.fromHexString(addressLenStr).toI32();
        let addressCount = addressesLen / METADATA_ADDRESS_LEN;
        let addressStart = METADATA_PREFIX_LEN + METADATA_VAR_LEN * 3;
        let addressEnd = addressStart + addressesLen;

        console.log(`addressCount: ${addressCount}`)
        for (let i = 0; i < addressCount; i += 1) {
            let addressOffset = addressStart + i * METADATA_ADDRESS_LEN;
            let address = metadata.slice(addressOffset, addressOffset + METADATA_ADDRESS_LEN);
            let viewingKeyOffset = addressEnd + i * METADATA_VIEWING_KEY_LEN;
            let viewingKey = metadata.slice(viewingKeyOffset, viewingKeyOffset + METADATA_VIEWING_KEY_LEN);
            accessMap.set('0x'.concat(address), viewingKey);
        }
    }
    return accessMap;
}