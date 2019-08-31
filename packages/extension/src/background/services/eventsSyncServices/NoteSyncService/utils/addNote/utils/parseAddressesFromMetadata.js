import {
    stripLeadingZeros
} from './stripLeadingZeros';
import {
    METADATA_PREFIX_LEN,
    METADATA_VAR_LEN,
    METADATA_ADDRESS_LEN,
} from '../config/constants';


export default function parseAddressesFromMetadata(metadata) {
    const addresses = [];
    if (metadata.length > METADATA_PREFIX_LEN) {
        let addressLenStr = stripLeadingZeros(metadata.slice(METADATA_PREFIX_LEN, METADATA_PREFIX_LEN + METADATA_VAR_LEN));
        let addressesLen = addressLenStr//Bytes.fromHexString(addressLenStr).toU32();
        // let addressCount = addressesLen / METADATA_ADDRESS_LEN;
        let addressStart = METADATA_PREFIX_LEN + METADATA_VAR_LEN * 3;
        let addressEnd = addressStart + addressesLen;

        for (let i = addressStart; i < addressEnd; i += METADATA_ADDRESS_LEN) {
            let address = metadata.slice(i, i + METADATA_ADDRESS_LEN);
            addresses.push(address);
        }
    }
    return addresses;
}